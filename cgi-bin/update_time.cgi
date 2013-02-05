#!c:\perl\bin\perl.exe
use strict;
use CGI;
use warnings;
use Fcntl qw(:flock);

my $cgi = new CGI();
print $cgi->header('text/html;charset=UTF8');
my $cur_time = $cgi->param('time');
print "$cur_time";
my $time_file = "../data/latest.time";  #file recording latest time
my $sem_file = "../data/temp1.txt";  #any file will do

sub get_lock {
	open(E,">$sem_file") || die "can't open $!";
	flock E, LOCK_EX;
}

sub release_lock {
	close(E);
}

get_lock();
open(TIME, ">$time_file") || die "can not open $!";
print TIME $cur_time;
close(TIME);
release_lock();
