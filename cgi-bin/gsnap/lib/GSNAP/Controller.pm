package GSNAP::Controller;
#
# This package is used to ...
#
# Minh-Thang Luong 03 June 09
#
use strict;
use GSNAP::Config;
use GSNAP::HTML;

#use Encode;
use LWP; 
use URI::Escape;
use HTTP::Cookies;
use Encode::Guess;
use HTML::Entities;
use Unicode::String;
use Utility::Controller;
#use XML::LibXML::Document;

### Start Main Program ###
##########################
my $browser = LWP::UserAgent->new;
my $cookie_jar = HTTP::Cookies->new;

$browser->agent('Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.12) Gecko/20101027 Fedora/3.6.12-1.fc13 Firefox/3.6.12');
$browser->cookie_jar( $cookie_jar );

my $LOG_LEVEL = $GSNAP::Config::LOG_LEVEL;
my $WAIT_TIME = $GSNAP::Config::WAIT_TIME;
my $SIM_THRESHOLD = $GSNAP::Config::SIM_THRESHOLD;

##
# main entry point
# Input:
#   $queries - reference to a hash of keyword queries
#   $labels  - reference to a hash of labels
#   $outDir  - directory to cache downloaded file from Google Scholar
#   $num     - num results expected from Google Scholar
#   $versionOpt     - enable details of paper versions to be included in the final output
#   $citedByOpt     - enable details of cited-by results to be included in the final output
#   $numTitleMatch n  - to check if the retrieved results have n titles closely match query, then stop to save processing time.
#   $LOG_LEVEL   - enable debugging output
#   $fromYear - only get results after this, ignore it if its value is "none"
#   $toYear - only get results before this ignore it if its value is "none"
# Output
#   $finalXML - summary of all results
#   $gsResults - reference to an array of all Results objects
##
sub main 
{
	my($queries, $option, $labels, $outDir, $num, $versionOpt, $citedByOpt, $numTitleMatch, $logLevel, $waitTime, $simThreshold, $fromYear, $toYear, $force) = @_;

	$LOG_LEVEL = $logLevel;
	# $WAIT_TIME = $waitTime;
	$SIM_THRESHOLD = $simThreshold;

	# There's an issue when initializing LWP ("Use of uninitialized value in concatenation (.) or string at /usr/lib/perl5/5.8.8/i386-linux-thread-multi/Scalar/Util.pm line 30, <IF> line 18."), work around by issue first query
	open SAVEERR, ">&STDERR";
	close STDERR;
	open STDERR, '>/dev/null';
	$browser->head("http://www.google.com");
	close STDERR;
	open STDERR, ">&SAVEERR";
	close SAVEERR;

	### Create output directory
	if(! -d $outDir)
	{
		print STDERR "$outDir not exist!\n";
		execute("mkdir -p $outDir");
	}
	if(! -d "$outDir/citedBy")
	{
		print STDERR "$outDir/citedBy not exist!\n";
		execute("mkdir -p $outDir/citedBy");
	}

	# XML header;
	my $algorithmVersion = $GSNAP::Config::algorithmVersion;
	my $algorithmName = $GSNAP::Config::algorithmName;
#	my $time = `date +%s `; chomp($time);
#	my $date = `date`; chomp($date);
	my $time = "9:00";
	my $date = "2013";
	my $finalXml = "<?xml version=\"1.0\" encoding='UTF-8'?>\n<results algorithmName=\"$algorithmName\" algorithmVersion=\"$algorithmVersion\" time=\"$time\" date=\"$date\">\n";

	# Process query by query
	for(my $i=0; $i < scalar(@{$queries}); $i++)
	{
		my $label = $labels->[$i];
		my $query = $queries->[$i];
		printLog("\nLabel = \"$label\", query = \"$query\"", $LOG_LEVEL);

		# Initiate first query 
		my $xmlBody = "";
		my $totalResults = "-1";
		my ($count, $xml, $totalCount);
		if($num ne "all" && $num <= 100)
		{
			printLog("Processing about $num results ... ", $LOG_LEVEL);
			($xml, $count, $totalResults) = singleQuery($query, $option, $label, $outDir, $num, 0, $versionOpt, $citedByOpt, $numTitleMatch, $fromYear, $toYear, $force);
		} 
		else 
		{
			printLog("Processing about 1-100 results ... ", $LOG_LEVEL);
			($xml, $count, $totalResults) = singleQuery($query, $option, $label, $outDir, 100, 0, $versionOpt, $citedByOpt, $numTitleMatch, $fromYear, $toYear, $force);
		}
		$xmlBody .= "$xml";
		$totalCount += $count;

		# Further processing if number of results > 100
		if($totalResults > 100) 
		{
			my $start = 100;
			if($num eq "all") { $num = $totalResults; }
			while($start < $num)
			{ 
			  	my $tmpNum = ($num - $start) > 100 ? 100 : ($num - $start); # Number of results to request GS
				printLog("Processing ".($start+1)."-".($start+$tmpNum)."/$num results", $LOG_LEVEL);
			 	my ($xml, $count) = singleQuery($query, $option, $label, $outDir, $tmpNum, $start, $versionOpt, $citedByOpt, $numTitleMatch, $fromYear, $toYear, $force);
			  	if($count == 0)
				{
			    	last;
			  	}
			  	$totalCount += $count;
			  	$xmlBody .= "$xml";
			  	$start += 100;
			} # end while
		} # end if > 100

		$finalXml .= wrapXML($label, $query, $totalCount, $totalResults, $xmlBody);
	} # end for query

	$finalXml .= "</results>\n";
	return ($finalXml);
}

### Handle each input query separately ###
sub singleQuery 
{
	my($query, $option, $label, $outDir, $num, $start, $versionOpt, $citedByOpt, $numTitleMatch, $fromYear, $toYear, $force) = @_;

	### Construct html file name from label
	my $htmlFile = "$outDir/$num-$start-$option-";
	$htmlFile .= ($label eq "")? ":" : uri_escape($label).":"; # add label
	$htmlFile .= uri_escape($query); # add query
	$htmlFile .= "-$fromYear-$toYear";
	$htmlFile = checkFileName($htmlFile); # check name length
	
	### Query GS
	return gsByQuery($query, $option, $num, $start, $outDir, $versionOpt, $citedByOpt, $numTitleMatch, $fromYear, $toYear, $htmlFile, $force);
}

### Check file existence and valid content
sub verify
{
	my ($inFile) = @_;
	
	my $status = 1;
	if(!-e $inFile)
	{
		$status = 0;
	} 
	else
	{
#		my $numLines = `wc -l < $inFile`;
		my $numLines = 0;
		chomp($numLines);
		if($numLines == 0)
		{
			print STDERR "! File $inFile has no content\n";
			$status = 0;
		}
	}

	return $status;
}

### Query GS fully with a query input ###
sub gsByQuery 
{
	my ($query, $option, $num, $start, $outDir, $versionOpt, $citedByOpt, $numTitleMatch, $fromYear, $toYear, $htmlFile, $force) = @_;
	
	my $totalResults = -1;

	# Not downloaded from GS before
	if ((!verify($htmlFile)) || (defined $force))
	{
		$query = uri_escape($query);
		# Then later, whenever you need to make a get request:
		my $url = "http://scholar.google.com.sg/scholar?q=$query&num=$num&start=$start&hl=en&btnG=Search";

		if($option eq "articles")
		{
			$url .= "&as_sdt=1%2C5&as_vis=1";
		} 
		elsif($option eq "articles-patents")
		{
			$url .= "&as_sdt=0%2C5";
		} 
		elsif($option eq "legal")
		{
			$url .= "&as_sdt=2%2C5";
		} 
		else 
		{
			die "Die: unknown option $option\n";
		}

		# Datetime
		$url .= "&as_ylo=";
		if ($fromYear ne "none")
		{
			$url .= $fromYear;	
		}
	
		$url .= "&as_yhi=";
		if ($toYear ne "none")
		{
			$url .= $toYear;	
		}

		if($LOG_LEVEL)
		{
			print STDERR "URL: $url";
			if($LOG_LEVEL == 3)
			{
			  	print STDERR "<BR>";
			}
			print STDERR "\n"; 
		}
		$totalResults = callGS($url, $htmlFile, $LOG_LEVEL, $WAIT_TIME);

		thangSleep($WAIT_TIME, $LOG_LEVEL);
	} 
	else 
	{
		printLog("$htmlFile has been cached before!", $LOG_LEVEL);

		open(HTML, "<:utf8", $htmlFile);
		while(<HTML>)
		{
			if(/^Total results = ([\d,]+)$/)
			{
			  	$totalResults = $1;
			  	last;
			}
		}
		close HTML;
	}
	$totalResults =~ s/,//g;

	### Process HTML file and output result summaries
	my ($count, $xmlBody, $gsResults) = GSNAP::HTML::process($htmlFile, $query, "", $num, $start, $outDir, "normal", $LOG_LEVEL, $WAIT_TIME, $SIM_THRESHOLD, $versionOpt, $citedByOpt, $numTitleMatch);
	return ($xmlBody, $count, $totalResults);
}

### Imitate a browser to query GS & preprocess downloaded result###
sub callGS 
{
	my($url, $outFile, $logLevel, $waitTime) = @_;

	# Fix: The finalXML output is already in UTF8 encode, so select ">:utf8" will re-encode it again and cause corrupted string output, 
	# 	   switch to binary IO,	huydhn
	#open(HTML, ">:utf8", $outFile) || die "#Can't open file \"$outFile\"";
	
	open(HTML, ">", $outFile) || die "#Can't open file \"$outFile\"";
	binmode(HTML);
	# End.

	my $response;
	my $content = "";
	while(1)
	{
		### Get HTML response from GS
		$response = $browser->get(
			$url,
			'User-Agent'		=> "Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.12) Gecko/20101027 Fedora/3.6.12-1.fc13 Firefox/3",
			'Accept'			=> "text/html, */*;q=0.1",
			'Accept-Charset'	=> "utf-8,ISO-8859-1;q=0.7,*;q=0.7",
			'Cookie'			=> "PREF=ID=9e06e12d4ad5c505:U=66268a1e06a87dc9:FF=4:LD=en:CR=2:TM=1331482244:LM=1355724706:GM=1:SG=2:S=yZ6afouFwodiUJd2; NID=67=m-es2O7i0oGz6Yp-6G-cQZXkRidSx1PlD0IjZPQ2UPZluWhQU6xZDrgtaXXAu2rmVXKBbo9eKqUnB2wf-ssxFJ19SRXpFkE2MFHryI_EirvInzW6vkW5GysidB2rR1WyNiCKaD_dGVGQKlI0jA; GSP=ID=9e06e12d4ad5c505:UI=1:S=wKRFP2vgde563b--; SS=DQAAALwAAABBjgG7Vg7noIVHGVwjJC1DEdn0yBnEoyTRUezNnJaugD6BYs2xNZRiIxb6ouX0pRSbDtqKhoYPnrTkYXVV379YBEY1IZl-SR7jjEwPv7Tzv8_cSOOkETeb-C16nF3afmURAGrildutrKLH_Jp_60NJTwcot40lc-3-ZUuFt2QxUOJf0JKZg25CUn9ebZMePMESFeAsfb9xTEmGnDrToqiMqbStCwoH5HJEZvYkqy9_3s38IwVb_0e1rVrlhS_XesQ; GDSESS=ID=b279bfa4d3a0bb7d:TM=1355723914:C=c:IP=137.132.3.9-:S=ADSvE-ehAnD1ISwZm-EJnTOlIApgPQRITw"
		);
		
		if($response->is_success)
		{
			die "Hey, I was expecting HTML, not ", $response->content_type unless $response->content_type eq 'text/html'; 
			$content = $response->content;
			if($content =~ /<html><head>/)
			{ # Check the content
			  	$content = $response->content; 
			  	last;
			} 
			else 
			{
			  	print STDERR "Invalid content\t";
			  	thangSleep($waitTime, $logLevel);
			  	$waitTime*=2; # exponential backoff
			}   
		} 
		else 
		{
			print STDERR $response->status_line."\t";
			thangSleep($waitTime, $logLevel);
			$waitTime*=2; # exponential backoff
		}
	}

	
	
	# Fix: do not guess charset if the web server reply has this information in its headers, huydhn
	# Check encodings and decode if necesary
	#Encode::Guess->add_suspects('iso-8859-1');
	#my $decoder = Encode::Guess->guess($content);	
	#if (ref($decoder))
	#{
		# print STDERR "Found encoding: ".$decoder->name."\n";  
	#	$content = $decoder->decode($content);
	#}

	# Convert content type from ISO-8859-1 from GS to UTF8
	$content = Unicode::String::latin1( $content );
	# End.
	#
	
	# This code is obsolete, Google Scholar has a new look
	# my $totalResults = -1;
	# if ($content =~ /Create email alert.*?Results.*?of.*?([\d,]+)/)
	# {
	#	$totalResults = $1;
	#	print HTML "Total results = $totalResults\n";
	# }
	# so replace by this
	my $totalResults = -1;
	if (($content =~ /<div\sid="?gs_ab_md"?>\s*About\s+([\d,]+)/m) || ($content =~ /<div\sid="?gs_ab_md"?>\s*([\d,]+)/m)) {
		$totalResults = $1;
		print HTML "Total results = $totalResults\n";
	}

	# Preprocess GS results
	# A search result starts with "<div class=gs_r><div class=gs_rt>", and ends with </div>.+?</div>
	# while($content =~ m/(<div class=gs_r><div class=gs_rt>.+?<\/div>.+?<\/div>)/sg)
	while($content =~ m/(<div[^>]*?class=\"?gs_r\"?(\s+style=\"[^>]*\")*>(<div class=\"?gs_ggs gs_fl\"?>.+?<\/div>)?<div[^>]*?class=\"?gs_ri\"?>(<h3 class=\"?gs_rt\"?>.+?<\/h3>)?(<div class=\"?gs_a\"?>.+?<\/div>)?(<div class=\"?gs_rs\"?>.+?<\/div>)?(<div class=\"?gs_fl\"?>.+?<\/div>)?<\/div><\/div>)/sg)
	{
		my $newContent = $1;

		# for easier process later, concatenate XML lines for a result into 1 line
		$newContent =~ s/\n//g;
		print HTML "$newContent\n";
	}		 
	close HTML;

	return $totalResults;
}

##
# Wrap XML result
# Input:
# Output:
#   $xml    - result summary file
##
sub wrapXML 
{
	my ($label, $query, $count, $totalResults, $xmlBody) = @_;

	# todo: consider using XML lib, e.g. XML::LibXML::Document
	$query =~ s/"/&quot;/g;
	my $xml .= "<query content=\"$query\" label=\"$label\" count=\"$count\" totalresults=\"$totalResults\">\n";
	$xml .= $xmlBody;
	$xml .= "</query>\n";
	
	return ($xml);
}

sub thangSleep 
{
	my ($time, $logLevel) = @_;
	my $sleepTime = rand($time) + $time;
	printLog("... Sleep for ${sleepTime}s", $logLevel);
#	execute("sleep $sleepTime");  #for linux
	system("ping -n $sleepTime 127.0.0.1 >nul");   #for windows 
}

### Check if file name is too long -> truncate ###
sub checkFileName 
{
	my ($htmlFile) = @_;
	if (length($htmlFile) > 250) 
	{ 	#maximum file length in UNIX, may vary across systems
		$htmlFile = substr($htmlFile, 0, 250);
		print STDERR "# Warning: filename exceeds 255 characters. Truncated to: $htmlFile.html\n";
	}
	$htmlFile .= ".html";
	
	$htmlFile = untaintPath($htmlFile);
}

sub printLog 
{
	my ($text, $logLevel) = @_;

	if($logLevel)
	{
		print STDERR "$text";

		if($logLevel == 3)
		{
			print STDERR "<BR>";
		}
		print STDERR "\n";
	}
}

sub untaintPath 
{
	my ($path) = @_;

	if ( $path =~ /^([-_:\/\w\.\%"\p{P}\p{C}]+)$/ ) 
	{
		$path = $1;
	} 
	else 
	{
		die "Bad path $path\n";
	}

	return $path;
}

sub untaint 
{
	my ($s) = @_;
	if ($s =~ /^([\w \-\@\(\),\.\/]+)$/) 
	{
		$s = $1;       	       # $data now untainted
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
	#print STDERR "# Executing: $cmd\n";
	$cmd = untaint($cmd);
	system($cmd);
}

sub newTmpFile 
{
	my $tmpFile = `date '+%Y%m%d-%H%M%S-$$'`;
	chomp($tmpFile);
	return $tmpFile;
}


1;
