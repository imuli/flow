module Pipe
%default total

data Pipe : (input : Type) -> (output : Type) -> (upstream : Type) -> (result : Type) -> Type where
  Push : (next : Pipe i o u r) -> (out : o) -> Pipe i o u r
  Pull : (more : (i -> Pipe i o u r)) -> (final : (u -> Pipe i o u r)) -> Pipe i o u r
  Pure : (result : r) -> Pipe i o u r

Source : Type -> Type -> Type
Source o u = Pipe () o u ()

Filter : Type -> Type -> Type
Filter i o = Pipe i o () ()

Sink : Type -> Type -> Type
Sink i r   = Pipe i () () r

%name Pipe up,down,up',down'

partial
id : Pipe i i r r
id = Pull (Push id) Pure

partial
fuseDown : Pipe a b x y -> Pipe b c y z -> Pipe a c x z
partial
fuseUp : (b -> Pipe b c y z) -> (y -> Pipe b c y z) -> Pipe a b x y -> Pipe a c x z
fuseDown up (Push next out)   = Push (fuseDown up next) out
fuseDown up (Pull more final) = fuseUp more final up
fuseDown up (Pure result)     = Pure result
fuseUp more final (Push next out)     = fuseDown next (more out)
fuseUp more final (Pull more' final') = Pull (fuseUp more final . more') (fuseUp more final . final')
fuseUp more final (Pure result)       = fuseDown (Pure result) (final result)

infixr 10 >|
partial
(>|) : (up : Pipe a b x y) -> (down : Pipe b c y z) -> Pipe a c x z
(>|) = fuseDown

sourceList : (source : List o) -> Source o ()
sourceList []        = Pure ()
sourceList (x :: xs) = Push (sourceList xs) x

sinkVect : (n : Nat) -> Sink i (List i)
sinkVect n = go id n where
  go : (is: List i -> List i) -> (n: Nat) -> Sink i (List i)
  go is Z     = Pure $ is []
  go is (S k) = Pull (\i => go (is . (i::)) k) (\_ => Pure $ is [])

partial
sinkList : Sink i (List i)
sinkList = go id where
  partial go : (is: List i -> List i) -> Sink i (List i)
  go is = Pull (\i => go (is . (i::))) (\_ => Pure $ is [])

consume : (n : Nat) -> Filter i i
consume Z     = Pure ()
consume (S k) = Pull (Push (consume k)) Pure

partial
map : (i -> o) -> Filter i o
map f = Pull (\i => Push (map f) $ f i) Pure

partial
foldSink : (r -> i -> r) -> r -> Sink i r
foldSink f a = Pull (\i => foldSink f (f a i)) (\_ => Pure a)

run : (pipe : Pipe i o () r) -> r
run (Push next out) = run next
run (Pull more final) = run (final ())
run (Pure result) = result

