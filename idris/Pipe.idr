module Pipe
%default total

public
data Pipe : (input : Type) -> (output : Type) -> (monad : Type -> Type) -> (upstream : Type) -> (result : Type) -> Type where
  Push : (fin : m _) -> (next : Pipe i o m u r) -> (out : o) -> Pipe i o m u r
  Pull : (done : (u -> Pipe i o m u r)) -> (more : (i -> Pipe i o m u r)) -> Pipe i o m u r
  Pure : (result : r) -> Pipe i o m u r
  ActM : (act : m (Pipe i o m u r)) -> Pipe i o m u r

public
Source : Type -> (Type -> Type) -> Type -> Type
Source o m u = Pipe () o m u ()

public
Filter : Type -> Type -> (Type -> Type) -> Type
Filter i o m = Pipe i o m () ()

public
Sink : Type -> (Type -> Type) -> Type -> Type
Sink i m r   = Pipe i () m () r

public
noop : Monad m => m ()
noop = return ()

%name Pipe up,down,up',down'

partial
id : Monad m => Pipe i i m r r
id = Pull Pure (Push noop id)

mutual
  partial
  fuseDown : Monad m => (final : m _) -> (up : Pipe a b m x y) -> (down : Pipe b c m y z) -> Pipe a c m x z
  fuseDown final up down =
    case down of
         Push fin next out => Push (do fin; final) (fuseDown final up next) out
         Pull done more    => fuseUp done final more up
         Pure result       => ActM (do final; return $ Pure result)
         ActM act          => ActM $ do return $ fuseDown final up !act

  partial
  fuseUp : Monad m => (final : (y -> Pipe b c m y z)) -> (last : m _) -> (down : (b -> Pipe b c m y z)) -> (up : Pipe a b m x y) -> Pipe a c m x z
  fuseUp final last down up =
    case up of
         Push fin next out => fuseDown fin next (down out)
         Pull done more    => Pull (fuseUp final last down . done) (fuseUp final last down . more)
         Pure result       => fuseDown noop (Pure result) (final result)
         ActM act          => ActM $ do return $ fuseUp final last down !act

infixr 10 >|
public
partial
(>|) : Monad m => (up : Pipe a b m x y) -> (down : Pipe b c m y z) -> Pipe a c m x z
(>|) = fuseDown noop

sourceList : Monad m => (source : List o) -> Source o m ()
sourceList []        = Pure ()
sourceList (x :: xs) = Push noop (sourceList xs) x

-- FIXME how to catch exceptions here?
public
partial
sourceM : Monad m => {default noop cleanup : m ()} -> (m o) -> Source o m ()
sourceM {cleanup} f = ActM $ do return $ Push cleanup (sourceM f) !(f)

partial
sinkM : Monad m => (cleanup : m r) -> (i -> m r) -> Sink i m r
sinkM cleanup f = Pull (\_ => ActM $ do return $ Pure !cleanup) (\i => ActM $ do f i; return $ sinkM cleanup f)

public
partial
sink : Monad m => {default noop cleanup : m ()} -> (i -> m ()) -> Sink i m ()
sink {cleanup} f = Pull (\_ => ActM $ do return $ Pure !cleanup) (\i => ActM $ do f i; return $ sink f)

sinkVect : Monad m => (n : Nat) -> Sink i m (List i)
sinkVect n = go id n where
  go : Monad m => (is: List i -> List i) -> (n: Nat) -> Sink i m (List i)
  go is Z     = Pure $ is []
  go is (S k) = Pull (\_ => Pure $ is []) (\i => go (is . (i::)) k)

partial
sinkList : Monad m => Sink i m (List i)
sinkList = go id where
  partial go : (is: List i -> List i) -> Sink i m (List i)
  go is = Pull (\_ => Pure $ is []) (\i => go (is . (i::)))

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

partial
sinkFold : (r -> i -> r) -> r -> Sink i m r
sinkFold f a = Pull (\_ => Pure a) (\i => sinkFold f (f a i))

public
partial
run : Monad m => (pipe : Pipe i o m () r) -> m r
run (Push fin next out) = run next
run (Pull final more)   = run (final ())
run (Pure result)       = return result
run (ActM act)          = run !act

