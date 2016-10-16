module Flow
%default total

export
data Flow : (input : Type) -> (output : Type) -> (monad : Type -> Type) -> (upstream : Type) -> (result : Type) -> Type where
  Push : (fin : m _) -> (next : Flow i o m u r) -> (out : o) -> Flow i o m u r
  Pull : (done : (u -> Flow i o m u r)) -> (more : (i -> Flow i o m u r)) -> Flow i o m u r
  Pure : (result : r) -> Flow i o m u r
  ActM : (act : m (Flow i o m u r)) -> Flow i o m u r

export
Source : Type -> (Type -> Type) -> Type -> Type
Source o m u = Flow () o m u ()

export
Filter : Type -> Type -> (Type -> Type) -> Type
Filter i o m = Flow i o m () ()

export
Sink : Type -> (Type -> Type) -> Type -> Type
Sink i m r   = Flow i () m () r

export
noop : Monad m => m ()
noop = pure ()

%name Flow up,down,up',down'

mutual
  partial
  fuseDown : Monad m => (final : m _) -> (up : Flow a b m x y) -> (down : Flow b c m y z) -> Flow a c m x z
  fuseDown final up down =
    case down of
         Push fin next out => Push (do fin; final) (fuseDown final up next) out
         Pull done more    => fuseUp done final more up
         Pure result       => ActM (do final; pure $ Pure result)
         ActM act          => ActM $ do pure $ fuseDown final up !act

  partial
  fuseUp : Monad m => (final : (y -> Flow b c m y z)) -> (last : m _) -> (down : (b -> Flow b c m y z)) -> (up : Flow a b m x y) -> Flow a c m x z
  fuseUp final last down up =
    case up of
         Push fin next out => fuseDown fin next (down out)
         Pull done more    => Pull (fuseUp final last down . done) (fuseUp final last down . more)
         Pure result       => fuseDown noop (Pure result) (final result)
         ActM act          => ActM $ do pure $ fuseUp final last down !act

infixr 0 >|
export
partial
(>|) : Monad m => (up : Flow a b m x y) -> (down : Flow b c m y z) -> Flow a c m x z
(>|) = fuseDown noop

mutual
  partial
  joinRight : Monad m => (left : Source (a -> b) m u) -> (right : Source a m u) -> Source b m u
  joinRight left right = case right of
                              (Push fin next out) => joinLeft fin left next out
                              (Pull done more)    => Pure () -- This doesn't happen
                              (Pure result)       => Pure result
                              (ActM act)          => ActM $ do pure $ joinRight left !act

  partial
  joinLeft : Monad m => (rfin : m _) -> (left : Source (a -> b) m u) -> (right : Source a m u) -> a -> Source b m u
  joinLeft rfin left right val = case left of
                              (Push fin next out) => Push (do rfin; pure fin) (joinRight next right) (out val)
                              (Pull done more)    => Pure () -- This doesn't happen
                              (Pure result)       => Pure result
                              (ActM act)          => ActM $ do pure $ joinLeft rfin !act right val

infixr 1 >|<
export
partial
(>|<) : Monad m => (left : Source (a -> b) m u) -> (right : Source a m u) -> Source b m u
(>|<) = joinRight

-- sources {{

export
sourceList : Monad m => (source : List o) -> Source o m ()
sourceList []        = Pure ()
sourceList (x :: xs) = Push noop (sourceList xs) x

-- FIXME how to catch exceptions here?
export
partial
sourceM : Monad m => {default noop cleanup : m ()} -> (m o) -> Source o m ()
sourceM {cleanup} f = ActM $ do pure $ Push cleanup (sourceM {cleanup=cleanup} f) !(f)

export
partial
sourceE : Monad m => {default noop cleanup : m ()} -> (m (Either e o)) -> Source o m ()
sourceE {cleanup} f = ActM $ do pure $ case !(f) of 
                                              Left _  => Pure ()
                                              Right d => Push cleanup (sourceE {cleanup=cleanup} f) d

-- sinks

export
partial
sinkE : Monad m => {default noop cleanup : m ()} -> (i -> m (Either e _)) -> Sink i m ()
sinkE {cleanup} f = Pull (\_ => ActM $ do pure $ Pure !cleanup)
                         (\i => ActM $ do pure $ case !(f i) of
                                                        Left _  => Pure ()
                                                        Right _ => sinkE {cleanup=cleanup} f)

export
partial
sinkM : Monad m => (cleanup : m r) -> (i -> m r) -> Sink i m r
sinkM cleanup f = Pull (\_ => ActM $ do pure $ Pure !cleanup) (\i => ActM $ do f i; pure $ sinkM cleanup f)

export
partial
sink : Monad m => {default noop cleanup : m ()} -> (i -> m ()) -> Sink i m ()
sink {cleanup} f = Pull (\_ => ActM $ do pure $ Pure !cleanup) (\i => ActM $ do f i; pure $ sink {cleanup=cleanup} f)

export
sinkVect : Monad m => (n : Nat) -> Sink i m (List i)
sinkVect n = go id n where
  go : Monad m => (is: List i -> List i) -> (n: Nat) -> Sink i m (List i)
  go is Z     = Pure $ is []
  go is (S k) = Pull (\_ => Pure $ is []) (\i => go (is . (i::)) k)

export
partial
sinkList : Monad m => Sink i m (List i)
sinkList = go id where
  partial go : (is: List i -> List i) -> Sink i m (List i)
  go is = Pull (\_ => Pure $ is []) (\i => go (is . (i::)))

export
partial
sinkFold : (r -> i -> r) -> r -> Sink i m r
sinkFold f a = Pull (\_ => Pure a) (\i => sinkFold f (f a i))

-- filters
-- filters that are partial don't terminate the chain

export
partial
id : Monad m => Filter i i m
id = Pull Pure (Push noop id)

export
consume : Monad m => (n : Nat) -> Filter i i m
consume Z     = Pure ()
consume (S k) = Pull Pure (Push noop (consume k))

export
partial
drop : Monad m => (n : Nat) -> Filter i i m
drop Z     = id
drop (S k) = Pull Pure $ (\_ => drop k)

export
partial
map : Monad m => (i -> o) -> Filter i o m
map f = Pull Pure (\i => Push noop (map f) (f i))

export
partial
condense : Monad m => (acc : a) -> (final : a -> o) -> (norm : i -> a -> Either a a) -> Filter i o m
condense acc final norm = condense' acc where
  condense' this = Pull (\u => Push noop (Pure u) (final this))
                        (\i => case norm i this of
                                    Left next => condense' next
                                    Right out => Push noop (condense' acc) (final out))

export
partial
split : Monad m => {default Nil pref : List i} -> (pred : (i -> Bool)) -> Filter i (List i) m
split {pref} pred = condense pref reverse split' where
  split' : i -> List i -> Either (List i) (List i)
  split' i is = if pred i then Right is
                          else Left (i :: is)

-- put them all together

export
partial
run : Monad m => (pipe : Sink _ m r) -> m r
run (Push fin next out) = run next
run (Pull final more)   = run (final ())
run (Pure result)       = pure result
run (ActM act)          = run !act

