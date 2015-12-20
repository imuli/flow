module Flow
%default total

public
data Flow : (input : Type) -> (output : Type) -> (monad : Type -> Type) -> (upstream : Type) -> (result : Type) -> Type where
  Push : (fin : m _) -> (next : Flow i o m u r) -> (out : o) -> Flow i o m u r
  Pull : (done : (u -> Flow i o m u r)) -> (more : (i -> Flow i o m u r)) -> Flow i o m u r
  Pure : (result : r) -> Flow i o m u r
  ActM : (act : m (Flow i o m u r)) -> Flow i o m u r

public
Source : Type -> (Type -> Type) -> Type -> Type
Source o m u = Flow () o m u ()

public
Filter : Type -> Type -> (Type -> Type) -> Type
Filter i o m = Flow i o m () ()

public
Sink : Type -> (Type -> Type) -> Type -> Type
Sink i m r   = Flow i () m () r

public
noop : Monad m => m ()
noop = return ()

%name Flow up,down,up',down'

mutual
  partial
  fuseDown : Monad m => (final : m _) -> (up : Flow a b m x y) -> (down : Flow b c m y z) -> Flow a c m x z
  fuseDown final up down =
    case down of
         Push fin next out => Push (do fin; final) (fuseDown final up next) out
         Pull done more    => fuseUp done final more up
         Pure result       => ActM (do final; return $ Pure result)
         ActM act          => ActM $ do return $ fuseDown final up !act

  partial
  fuseUp : Monad m => (final : (y -> Flow b c m y z)) -> (last : m _) -> (down : (b -> Flow b c m y z)) -> (up : Flow a b m x y) -> Flow a c m x z
  fuseUp final last down up =
    case up of
         Push fin next out => fuseDown fin next (down out)
         Pull done more    => Pull (fuseUp final last down . done) (fuseUp final last down . more)
         Pure result       => fuseDown noop (Pure result) (final result)
         ActM act          => ActM $ do return $ fuseUp final last down !act

infixr 10 >|
public
partial
(>|) : Monad m => (up : Flow a b m x y) -> (down : Flow b c m y z) -> Flow a c m x z
(>|) = fuseDown noop

-- sources {{

public
sourceList : Monad m => (source : List o) -> Source o m ()
sourceList []        = Pure ()
sourceList (x :: xs) = Push noop (sourceList xs) x

-- FIXME how to catch exceptions here?
public
partial
sourceM : Monad m => {default noop cleanup : m ()} -> (m o) -> Source o m ()
sourceM {cleanup} f = ActM $ do return $ Push cleanup (sourceM {cleanup=cleanup} f) !(f)

public
partial
sourceE : Monad m => {default noop cleanup : m ()} -> (m (Either e o)) -> Source o m ()
sourceE {cleanup} f = ActM $ do return $ case !(f) of 
                                              Left _  => Pure ()
                                              Right d => Push cleanup (sourceE {cleanup=cleanup} f) d

-- sinks

public
partial
sinkE : Monad m => {default noop cleanup : m ()} -> (i -> m (Either e _)) -> Sink i m ()
sinkE {cleanup} f = Pull (\_ => ActM $ do return $ Pure !cleanup)
                         (\i => ActM $ do return $ case !(f i) of
                                                        Left _  => Pure ()
                                                        Right _ => sinkE {cleanup=cleanup} f)

public
partial
sinkM : Monad m => (cleanup : m r) -> (i -> m r) -> Sink i m r
sinkM cleanup f = Pull (\_ => ActM $ do return $ Pure !cleanup) (\i => ActM $ do f i; return $ sinkM cleanup f)

public
partial
sink : Monad m => {default noop cleanup : m ()} -> (i -> m ()) -> Sink i m ()
sink {cleanup} f = Pull (\_ => ActM $ do return $ Pure !cleanup) (\i => ActM $ do f i; return $ sink {cleanup=cleanup} f)

public
sinkVect : Monad m => (n : Nat) -> Sink i m (List i)
sinkVect n = go id n where
  go : Monad m => (is: List i -> List i) -> (n: Nat) -> Sink i m (List i)
  go is Z     = Pure $ is []
  go is (S k) = Pull (\_ => Pure $ is []) (\i => go (is . (i::)) k)

public
partial
sinkList : Monad m => Sink i m (List i)
sinkList = go id where
  partial go : (is: List i -> List i) -> Sink i m (List i)
  go is = Pull (\_ => Pure $ is []) (\i => go (is . (i::)))

public
partial
sinkFold : (r -> i -> r) -> r -> Sink i m r
sinkFold f a = Pull (\_ => Pure a) (\i => sinkFold f (f a i))

-- filters
-- filters that are partial don't terminate the chain

public
partial
id : Monad m => Filter i i m
id = Pull Pure (Push noop id)

public
consume : Monad m => (n : Nat) -> Filter i i m
consume Z     = Pure ()
consume (S k) = Pull Pure (Push noop (consume k))

public
partial
drop : Monad m => (n : Nat) -> Filter i i m
drop Z     = id
drop (S k) = Pull Pure $ (\_ => drop k)

public
partial
map : Monad m => (i -> o) -> Filter i o m
map f = Pull Pure (\i => Push noop (map f) (f i))

public
partial
condense : Monad m => (acc : a) -> (final : a -> o) -> (norm : i -> a -> Either a a) -> Filter i o m
condense acc final norm = condense' acc where
  condense' this = Pull (\u => Push noop (Pure u) (final this))
                        (\i => case norm i this of
                                    Left next => condense' next
                                    Right out => Push noop (condense' acc) (final out))

public
partial
split : Monad m => {default Nil pref : List i} -> (pred : (i -> Bool)) -> Filter i (List i) m
split {pref} pred = condense pref reverse split' where
  split' : i -> List i -> Either (List i) (List i)
  split' i is = if pred i then Right is
                          else Left (i :: is)

-- put them all together

public
partial
run : Monad m => (pipe : Flow i o m () r) -> m r
run (Push fin next out) = run next
run (Pull final more)   = run (final ())
run (Pure result)       = return result
run (ActM act)          = run !act

