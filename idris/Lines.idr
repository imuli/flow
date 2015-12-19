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

main : IO ()
main = do [prog, count] <- getArgs | []                    => usage ""   "I have no name!"
                                   | [prog]                => usage prog "Too few arguments."
                                   | (prog :: count :: xs) => usage prog "Too many arguments."
          case parsePositive count of
               Just cnt => run $ sourceM getLine >| consume cnt >| sink putStrLn
               Nothing  => usage prog $ count ++ " is not a natural number."
