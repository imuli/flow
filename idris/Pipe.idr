module Pipe
%default total

data Pipe : (input : Type) -> (output : Type) -> (upstream : Type) -> (result : Type) -> Type where
  Push : (next : Lazy $ Pipe i o u r) -> (out : o) -> Pipe i o u r
  Pull : (more : (i -> Lazy $ Pipe i o u r)) -> (final : (u -> Lazy $ Pipe i o u r)) -> Pipe i o u r
  Pure : (result : r) -> Pipe i o u r
  Fuse : (up : Lazy $ Pipe a b x y) -> (down : Lazy $ Pipe b c y z) -> Pipe a c x z

LPipe : (input : Type) -> (output : Type) -> (upstream : Type) -> (result : Type) -> Type
LPipe i o u r = Lazy $ Pipe i o u r

LPush : (next : Lazy $ Pipe i o u r) -> (out : o) -> Lazy $ Pipe i o u r
LPush next out = Delay $ Push next out
LPull : (more : (i -> Lazy $ Pipe i o u r)) -> (final : (u -> Lazy $ Pipe i o u r)) -> Lazy $ Pipe i o u r
LPull more final = Delay $ Pull more final
LPure : (result : r) -> Lazy $ Pipe i o u r
LPure result = Delay $ Pure result
LFuse : (up : Lazy $ Pipe a b x y) -> (down : Lazy $ Pipe b c y z) -> LPipe a c x z
LFuse up down = Delay $ Fuse up down

Source : Type -> Type -> Type
Source o u = LPipe () o u ()

Filter : Type -> Type -> Type
Filter i o = LPipe i o () ()

Sink : Type -> Type -> Type
Sink i r   = LPipe i () () r

%name LPipe up,down,up',down'

partial
idP : LPipe i i r r
idP = LPull (LPush idP) LPure

partial
fuseDown : LPipe a b x y -> LPipe b c y z -> LPipe a c x z
partial
fuseUp : (b -> LPipe b c y z) -> (y -> LPipe b c y z) -> LPipe a b x y -> LPipe a c x z
fuseDown up (Delay $ Push next out)   = LPush (fuseDown up next) out
fuseDown up (Delay $ Pull more final) = fuseUp more final up
fuseDown up (Delay $ Pure result)     = LPure result
fuseUp more final (Delay $ Push next out)     = fuseDown next (more out)
fuseUp more final (Delay $ Pull more' final') = LPull (fuseUp more final . more') (fuseUp more final . final')
fuseUp more final (Delay $ Pure result)       = fuseDown (LPure result) (final result)

infixr 10 >|
partial
(>|) : (up : LPipe a b x y) -> (down : LPipe b c y z) -> LPipe a c x z
(>|) = LFuse

sourceList : (source : List o) -> Source o ()
sourceList []        = LPure ()
sourceList (x :: xs) = LPush (sourceList xs) x

sinkVect : (n : Nat) -> Sink i (List i)
sinkVect n = go id n where
  go : (is: List i -> List i) -> (n: Nat) -> Sink i (List i)
  go is Z     = LPure $ is []
  go is (S k) = LPull (\i => go (is . (i::)) k) (\_ => LPure $ is [])

partial
sinkList : Sink i (List i)
sinkList = go id where
  partial go : (is: List i -> List i) -> Sink i (List i)
  go is = LPull (\i => go (is . (i::))) (\_ => LPure $ is [])

consume : (n : Nat) -> Filter i i
consume Z     = LPure ()
consume (S k) = LPull (LPush (consume k)) LPure

-- partial
-- map : (i -> o) -> Filter i o
-- map f = LPull (\i => LPush (Delay (Force $ Pipe.map f)) (Force $ f i)) LPure

partial
foldSink : (r -> i -> r) -> r -> Sink i r
foldSink f a = LPull (\i => foldSink f (f a i)) (\_ => LPure a)

partial
run : (pipe : LPipe i o () r) -> r
run (Delay $ Push next out) = run next
run (Delay $ Pull more final) = run (final ())
run (Delay $ Pure result) = result
run (Delay $ Fuse up down) = run $ fuseDown up down

