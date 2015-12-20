module Main
import Pipe
import Data.String

errStr : (message : String) -> IO ()
errStr message = do fPutStr stderr message
                    return ()

errLine : (message : String) -> IO ()
errLine message = errStr $ message ++ "\n"

usage : String -> String -> IO ()
usage prog err = do errLine err
                    errLine $ "Usage: " ++ prog ++ " (count)"

go : Nat -> Nat -> IO ()
go skip count = run $ sourceM getLine >| drop skip >| consume count >| sink putStrLn

try : (prog : String) -> (skip : String) -> (end : String) -> IO ()
try prog skip end = case (parsePositive {a=Nat} skip, parsePositive {a=Nat} end) of
                        (Just s, Just e) => case isLTE s e of
                                                 Yes prf   => go s (e-s)
                                                 No contra => usage prog $ skip ++ " is greater than " ++ end
                        _                => usage prog $ skip ++ " and " ++ end ++ " are not both natural numbers."

main : IO ()
main = do
  args <- getArgs | []                     => usage ""   "I have no name!"
                  | [prog]                 => usage prog "Too few arguments."
                  | (prog :: s :: e :: xs) => usage prog "Too many arguments."
  case args of
       [prog, skip, end] => try prog skip end
       [prog, end]       => try prog "0" end
