#!/usr/bin/perl -w
use strict;
$ENV{'PATH'} = '/bin;/usr/bin;/usr/local/bin;C:/Windows/system32';
system("ping -n 5 127.0.0.1 >nul");
system("dir");
print STDOUT "aaa";