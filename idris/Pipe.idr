module Pipe
import Data.Fin
%default total

data Pipe : (input : Type) -> (output : Type) -> (monad : Type -> Type) -> (upstream : Type) -> (result : Type) -> Type where
  Push : (next : Pipe i o m u r) -> (out : o) -> Pipe i o m u r
  Pull : (final : (u -> Pipe i o m u r)) -> (more : (i -> Pipe i o m u r)) -> Pipe i o m u r
  Pure : (result : r) -> Pipe i o m u r
  ActM : (act : m (Pipe i o m u r)) -> Pipe i o m u r

Source : Type -> (Type -> Type) -> Type -> Type
Source o m u = Pipe () o m u ()

Filter : Type -> Type -> (Type -> Type) -> Type
Filter i o m = Pipe i o m () ()

Sink : Type -> (Type -> Type) -> Type -> Type
Sink i m r   = Pipe i () m () r

%name Pipe up,down,up',down'

partial
id : Pipe i i m r r
id = Pull Pure (Push id)

mutual
  partial
  fuseDown : Monad m => (up : Pipe a b m x y) -> (down : Pipe b c m y z) -> Pipe a c m x z
  fuseDown up down =
    case down of
         (Push next out)   => Push (fuseDown up next) out
         (Pull final more) => fuseUp final more up
         (Pure result)     => Pure result
         (ActM act)        => ActM $ do return $ fuseDown up !act

  partial
  fuseUp : Monad m => (final : (y -> Pipe b c m y z)) -> (more : (b -> Pipe b c m y z)) -> (up : Pipe a b m x y) -> Pipe a c m x z
  fuseUp final more up =
    case up of
         (Push next out)     => fuseDown next (more out)
         (Pull final' more') => Pull (fuseUp final more . final') (fuseUp final more . more')
         (Pure result)       => fuseDown (Pure result) (final result)
         (ActM act)          => ActM $ do return $ fuseUp final more !act

infixr 10 >|
partial
(>|) : Monad m => (up : Pipe a b m x y) -> (down : Pipe b c m y z) -> Pipe a c m x z
(>|) = fuseDown

sourceList : (source : List o) -> Source o m ()
sourceList []        = Pure ()
sourceList (x :: xs) = Push (sourceList xs) x

-- FIXME how to catch exceptions here?
partial
sourceM : Monad m => (m o) -> Source o m ()
sourceM f = ActM $ do return $ Push (sourceM f) !(f)

partial
sinkM : Monad m => (i -> m r) -> r -> Sink i m r
sinkM f x = Pull (\_ => Pure x) (\i => ActM $ do return $ sinkM f !(f i))

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

consume : (n : Nat) -> Filter i i m
consume Z     = Pure ()
consume (S k) = Pull Pure (Push (consume k))

partial
map : Monad m => (i -> o) -> Filter i o m
map f = Pull Pure (\i => Push (map f) (f i))

partial
sinkFold : (r -> i -> r) -> r -> Sink i m r
sinkFold f a = Pull (\_ => Pure a) (\i => sinkFold f (f a i))

partial
run : Monad m => (pipe : Pipe i o m () r) -> r
run (Push next out)   = run next
run (Pull final more) = run (final ())
run (Pure result)     = result

