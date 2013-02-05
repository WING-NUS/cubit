#!/usr/bin/perl -wT

require 5.0;

# Author: Luong Minh Thang <luongmin@comp.nus.edu.sg>, generated at Tue, 04 Aug 2009 22:30:49
# Modified from template by Min-Yen Kan <kanmy@comp.nus.edu.sg>

#use lib "/home/huydhn/perl5/lib";
use lib "gsnap/lib";

use strict;
use Getopt::Long;

# I do not know a better solution to find a lib path in -T mode.
# So if you know a better solution, I'd be glad to hear.
# See this http://www.perlmonks.org/?node_id=585299 for why I used the below code
use FindBin;
my $path;
BEGIN 
{
	if ($FindBin::Bin =~ /(.*)/) 
	{
		$path = $1;
	}
}
use lib "$path/../lib";

### USER customizable section
$0 =~ /([^\/]+)$/; my $progname = $1;
my $output_version = "1.0";
### END user customizable section

# Local libraries
use GSNAP::Config;
use GSNAP::Controller;

sub License 
{
	print STDERR "# Copyright 2009 \251 by Luong Minh Thang\n";
}

my $SIM_THRESHOLD	= $GSNAP::Config::SIM_THRESHOLD;
my $LOG_LEVEL 		= $GSNAP::Config::LOG_LEVEL;
my $WAIT_TIME 		= $GSNAP::Config::WAIT_TIME;

### HELP Sub-procedure
sub Help 
{
	print STDERR "usage: $progname -h\t[invokes help]\n";
	print STDERR "       $progname (-in inFile | -query query) -out outFile -dir outDir [-n numResults -opt option -version option -citedBy option -fromYear yyyy -toYear yyyy -match -log logLevel -w waitTime]\n";
	print STDERR "Options:\n";
	print STDERR "\t-q\tQuiet Mode (don't echo license)\n";
	print STDERR "\t-in, -query: mutually exclusive options to specify multiple queries or single one)\n";
	print STDERR "\t\t-in: specify a file containing a list of queries (in the format \"label:keyWords\" per line)\n";
	print STDERR "\t\t-query: specify a query (in the format \"label:keyWords\")\n";
	print STDERR "\t-out: output file stored in XML format.\n";
	print STDERR "\t-dir: directory to store cached GS returned results\n";
	
	## Optional parameters ##
	print STDERR "\n\t-n: option=number of results or \"all\" (default=10)\n";
	print STDERR "\t-opt: document type, option=(articles|articles-patents|legal) (default=articles)\n";
	print STDERR "\t-version: version information, option=number of results or \"all\"\n";
	print STDERR "\t-citedBy: citedBy information, option=number of results or \"all\"\n";
	print STDERR "\t-match: stop processing once found a title closely match the query (i.e. their normalized LCS value > $SIM_THRESHOLD\n";
	print STDERR "\t-log: output log messages, level 0 (no log), 1 (few), 2 (all). When level=3, HTML markup logs will be output (default=$LOG_LEVEL)\n";
	print STDERR "\t-w: specify wait time range in s between each GS query, wait time in [w, 2*w] (default=$WAIT_TIME)\n";
	
	print STDERR "\t-fromYear: put a time restriction in the form yyyy, only get results which are later than this (default=none)\n";
	print STDERR "\t-toYear: put a time restriction in the form yyyy, only get results which are earlier than this (default=none)\n";
}

my $QUIET = 0;
my $HELP = 0;
my $inFile = undef;
my $query = undef;

my $outFile = undef;
my $outDir = undef;
my $numResults = 10;
my $opt = "articles";
my $versionOpt = undef;
my $citedByOpt = undef;
my $numTitleMatch = 0;

my $fromYear = "none";
my $toYear = "none";

my $force = undef;

$HELP = 1 unless GetOptions('in=s' 		=> \$inFile,
			 				'query=s' 	=> \$query,
			 				'out=s' 	=> \$outFile,
			 				'dir=s' 	=> \$outDir,
			 				'n=s' 		=> \$numResults,
			 				'opt=s' 	=> \$opt,
			 				'version=s' => \$versionOpt,
			 				'citedBy=s' => \$citedByOpt,
			 				'match=i' 	=> \$numTitleMatch,
			 				'log=i' 	=> \$LOG_LEVEL,
			 				'w=i' 		=> \$WAIT_TIME,
			 				'h' 		=> \$HELP,
			 				'q' 		=> \$QUIET,
							'force'		=> \$force,
							'fromYear=s'=> \$fromYear,
							'toYear=s' 	=> \$toYear);

if ($HELP || !defined $outFile || !defined $outDir) 
{
	Help();
	exit(0);
}
if (!$QUIET) 
{
	License();
}

# Sanity check
if (defined $inFile && defined $query)
{
	die "Die: -in option is mutually exclusive with -query\n";
}
elsif (!defined $inFile && !defined $query)
{
	die "Die: no -query or -in option is used\n";
}

if ($opt ne "articles" && $opt ne "articles-patents" && $opt ne "legal")
{
	die "Die: invalide option \"$opt\"\n";
}

### Untaint ###
if(defined $inFile)
{
	$inFile = untaintPath($inFile);
}
if(defined $versionOpt)
{
	$versionOpt = untaintPath($versionOpt);
}
if(defined $citedByOpt)
{
	$citedByOpt = untaintPath($citedByOpt);
}
$outFile = untaintPath($outFile);
$outDir = untaintPath($outDir);
$LOG_LEVEL = untaintPath($LOG_LEVEL);
$WAIT_TIME = untaintPath($WAIT_TIME);

if ($fromYear ne "none")
{
	$fromYear = untaintYear($fromYear);
}

if ($toYear ne "none")
{
	$toYear = untaintYear($toYear);
}

$ENV{'PATH'} = '/bin;/usr/bin;/usr/local/bin;C:/Windows/system32';
### End untaint ###

# Update Config file
#my $configFile = $path."/../lib/GS/Config.pm";
#system("perl -pi -e 's/LOG_LEVEL = [\\d]+/LOG_LEVEL = $LOG_LEVEL/' $configFile");
#system("perl -pi -e 's/WAIT_TIME = [\\d]+/WAIT_TIME = $WAIT_TIME/' $configFile");

##########################
### Start Main Program ###
##########################

### Get queries and process

my @labels = ();
my @queries = ();
if(defined $inFile)
{
	getLabelQuery($inFile, \@queries, \@labels);
} 
else 
{
	# Disable labels - huydhn
	#if($query =~ /^(.*?):(.*)$/)
	#{
	#	push(@labels, $1);
	#	push(@queries, $2);
	#} 
	#else 
	#{# no label is specified
	#	push(@labels, "");
	#	push(@queries, $query);
	#}
	push @labels, "";
	push @queries, $query;
}

#print STDERR "###Results will be output to $outFile\n";
my $finalXML = GSNAP::Controller::main(	\@queries, 
										$opt, 
										\@labels, 
										$outDir, 
										$numResults, 
										$versionOpt, 
										$citedByOpt, 
										$numTitleMatch, 
										$LOG_LEVEL, 
										$WAIT_TIME, 
										$SIM_THRESHOLD,
										$fromYear,
										$toYear,
										$force	);

# NOTE: I really don't understand how perl and its underling process utf-8 document, it sucks ass
open(OF, ">:utf8", $outFile) || die "#Can't open file \"$outFile\"";
print OF $finalXML;
close OF;

#open(OF, ">", $outFile) || die "#Can't open file \"$outFile\"";
#binmode(OF);
#print OF $finalXML;
#close OF;
# End.

########################
### End Main Program ###
########################

##
# Process query file and return list of queries and labels
# Input:
#   $inFile  - query file
# Output:
#   $queries - array of queries
#   $labels  - array of labels
##
sub getLabelQuery
{
	my ($inFile, $queries, $labels) = @_;

	#file I/O
	if(! (-e $inFile))
	{
		die "#File \"$inFile\" doesn't exist";
	}
	open(IF, "<:utf8", $inFile) || die "#Can't open file \"$inFile\"";
	
	#process input file
	while(<IF>)
	{
		chomp;
		if(/^\#/){ next; }

		if(/^(.*?):?(.+)$/)
		{
			my $label = $1;
			my $query= $2;
			
			#trim leading and trailing spaces
			$label =~ s/^\s+//;
			$label =~ s/\s+$//;
			$query =~ s/^\s+//;
			$query =~ s/\s+$//;

			push(@{$labels}, $label);
			push(@{$queries}, $query);
		}
	}
	
	close IF;
}


sub untaintPath 
{
	my ($path) = @_;

	if ($path =~ /^([-_:" \/\w\.%\p{C}\p{P}]+)$/ ) 
	{
		$path = $1;
	} 
	else 
	{
		die "Bad path \"$path\"\n";
	}

	return $path;
}

sub untaintYear
{
	my ($year) = @_;

	if ($year =~ /^([12]\d{3})$/)
	{
		$year = $1;
	}
	else
	{
		die "Bad year number $year \n";
	}

	return $year;
}

sub untaint 
{
	my ($s) = @_;
	if ($s =~ /^([\w \-\@\(\),\.\/>\p{C}\p{P}]+)$/) 
	{
		$s = $1;               # $data now untainted
	} 
	else 
	{
		die "Bad data in $s";  # log this somewhere
	}
	return $s;
}

sub execute 
{
	my ($cmd) = @_;
	print STDERR "Executing: $cmd\n";
	$cmd = untaint($cmd);
	system($cmd);
}

sub newTmpFile 
{
	my $tmpFile = `date '+%Y%m%d-%H%M%S-$$'`;
	chomp($tmpFile);
	return $tmpFile;
}



