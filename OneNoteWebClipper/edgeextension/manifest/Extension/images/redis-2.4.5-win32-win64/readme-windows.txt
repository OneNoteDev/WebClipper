Windows 32 and x64 port of Redis server, client and utils
---------------------------------------------------------

It is made to be as close as possible to original unix version.
You can download prebuilt binaries here: 

   https://github.com/dmajkic/redis/downloads

Building Redis on Windows
-------------------------

Building Redis on Windows requires MinGW. If you are using full 
msysGit, you allready have all tools needed for the job. 

Start Git bash, and clone this repository:

   $ git clone http://github.com/dmajkic/redis.git

Compile it:

   $ make 

Test it: 

   $ make test 

Compiled programs are in source dir, and have no external dependencies.

Windows x64 port notice
-----------------------

Since there are more diferences between Linux and Windows 64bit systems,
and even if all tests suplied with redis pass, this port should be 
treated as experimental build, in need for more testing. 

To build it yourself you will need x64 gcc compiler (TDM or like).
Build procedure is same as 32 bit version. 

On 64bit windows, you can start 64bit redis-server from 32bit app
and use it to access more than 3,5Gb memory. 
 
What is done and what is missing
--------------------------------

Commands that use fork() to perform backgroud operations are implemented 
as foreground operations. These are BGSAVE and BGREWRITEAOF. 
Both still work - only in foreground. All original tests pass.

Everything is ported: redis-cli, hiredis with linenoise, rdb dumps, 
virtual memory with threads and pipes, replication, all commands, etc.

You can install and use all ruby gems that use Redis on windows.
You can develop on windows with local, native Redis server.
You can use redis-cli.exe to connect to unix servers.
...

Future plans
------------ 

Run tests, fix bugs, try to follow what Salvatore and Pieter are coding.

This port is bare. Redis-server.exe is console application, that can
be started from console or your app. It is not true Windows Service 
app.

Windows service support is near, and it will be in the next version.
Pull request with full service support from Rui Lopes is under review.

Please, don't forget to read redis README for more info.

That's it. Enjoy. 

Regads,
Dusan Majkic

