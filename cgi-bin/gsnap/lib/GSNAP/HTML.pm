package GSNAP::HTML;

###
# This package is used to ...
#
# Minh-Thang Luong 20 July 10
###
use strict;
use GSNAP::Controller;
use GSNAP::Result;
use GSNAP::Config;
use URI::Escape;
use Class::Struct;

my $LOG_LEVEL = $GSNAP::Config::LOG_LEVEL;
my $WAIT_TIME = $GSNAP::Config::WAIT_TIME;
my $SIM_THRESHOLD = $GSNAP::Config::SIM_THRESHOLD;

### Note: I've used to use HTML::TreeBuilder to process the HTML file. However, due to some encoding problem of this package, I decided to process GS's pages by myself.
sub process 
{
	my ($inFile, $query, $prefix, $num, $start, $outDir, $option, $logLevel, $waitTime, $simThreshold, $versionOpt, $citedByOpt, $numTitleMatch) = @_;
	$LOG_LEVEL = $logLevel;
	$WAIT_TIME = $waitTime;
	$SIM_THRESHOLD = $simThreshold;

	my @gsResults = ();
	#$allCitedByYear = \@gsResults;

	my $fh;
	open(IF, "<:utf8", $inFile) || die "#Can't open file \"$inFile\"";    

	if($option eq "normal")
	{
		if($LOG_LEVEL && $LOG_LEVEL != 3)
		{
			print STDERR "# Process HTML file $inFile\n";
		}
	} 
	elsif ($option eq "citedBy")
	{
		if($LOG_LEVEL && $LOG_LEVEL != 3)
		{
			print STDERR "# Process cited-by results, stored in $inFile\n";
		}
	}

	# useful information
	my ($title, $url, $type, $pdf, $author, $proceeding, $year, $proceedingYear, $source, $snippet, $versions);
	my %citeInfo = (); #map citation-related info to the corresponding link

	my $id = 0; #num of results returned by GS
	my $xmlBody = "";

	my $isStart = 0;
	my $line;
	binmode(STDERR, ":utf8");

	my @data = <IF>;
	for(my $i=0; $i<scalar(@data); $i++)
	{
		$line = $data[$i];
		chomp($line);

		if($line =~ /^<div[^>]*?class=\"?gs_r\"?(\s+style=\"[^>]*\")*>/)
		{ 	# a search result
			#$line = $1;
			#reset
			%citeInfo = ();
			($title, $url, $type, $pdf, $author, $proceeding, $year, $proceedingYear, $source, $snippet) = (undef, undef, undef, undef, undef, undef, undef, undef, undef, undef, undef);

			### PDF link
			if($line =~ /<div class=\"?gs_ggs gs_fl\"?>.*?<a[^>]*?href=\"(.+?)\".*>.*<\/a>.*?/)
			{
				$pdf = $1;
			}
			
			if($option eq "version")
			{
				if(defined $pdf)
				{
					$xmlBody .= "$pdf|||";
			 		$id++;
				}
				next;
			}

			### title ###
			if($line =~ /<h3.*?>(.+)<\/h3>/)
			{
				my $titleLine = $1;
				($title, $url, $type) = processTitleLine($titleLine, $id, $option, $LOG_LEVEL);

				my $strangeCharCount = $title =~ tr/\&\#/\&\#/;
				if($strangeCharCount > 5)
				{
			 		if($LOG_LEVEL == 2)
					{
			    		print STDERR "! Remove $option result: \"$title\"\n";
			  		}
				  	next;
				}	
		
				if($option eq "normal")
				{
					if($LOG_LEVEL == 3)
					{
			   			if(defined $url)
						{
			     			print STDERR "## Paper ".($id+$start).": <a href=\"$url\">$title</a>";
			   			} 
						elsif (defined $type)
						{
			     			print STDERR "## Paper ".($id+$start).": $type $title";
			   			} 
						else 
						{
			     			print STDERR "## Paper ".($id+$start).": $title";
			   			}
			  
			   			if(defined $pdf)
						{
			     			print STDERR " <a href=\"$pdf\">[PDF]</a>";
			   			}	

			   			print STDERR "<BR>\n";
			 		} 
					elsif ($LOG_LEVEL) 
					{
						print STDERR "## Paper ".($id+$start).": $title\n";
			 		}
				}
			}
			else 
			{
				# die "Die: no title line with tag <h3> ... </h3>\n$line\n";
			}

			my $meta;
			### Metadata & Snippet
			if($line =~ /<div class=\"?gs_a\"?>(.+?)<\/div><div class=\"gs_rs\">(.*)<div class=\"gs_fl\"/)
			{
				$meta = $1;
				$snippet = $2;
			} elsif ($line =~ /<div class=\"?gs_a\"?>(.+?)<\/div>(.*)<\/font>/) 
			{
				$meta = $1;
				$snippet = $2;
			}
			
			if($meta eq "")
			{
				if($LOG_LEVEL == 2)
				{
					print STDERR "#Warning: empty metadata\n$line\n";
				}
			}
			
			if($snippet eq "") 
			{ 
				$snippet = undef;
				if ($LOG_LEVEL == 2) 
				{
					print STDERR "#Warning: empty snippet\n$line\n";
				}
			}

			($author, $proceedingYear, $source) = split(/ \- /, $meta);
			
			if(defined $proceedingYear)
			{
				if($proceedingYear =~ /^\s*(.+), (\d+)\s*$/)
				{
					$proceeding = $1;
					$year = $2;
				} 
				elsif ($proceedingYear =~ /^\s*(\d+)\s*$/) 
				{ #only year
					$year = $1;
				} 
				else 
				{
					$proceeding = $proceedingYear;
				}
			}

			### Citation info
			if($line =~ /<div class=\"?gs_fl\"?>(.+?)<\/div/)
			{
				my $citation = $1;
				# Get citation info
				while ($citation =~ /(<a.+?<\/a>)/g) 
				{
					my $tmp = $1;

					# Get content of tag "a" as well as value of attribute "href"
					my ($text, $attrValue) = getContentAttribute($tmp, "a", "href");
					# Print STDERR "$text\t$attrValue\n";
					$citeInfo{$text} = $attrValue;
				}
			}

			my $numVersions;
			if($option eq "normal")
			{### versions
				my ($key, $value) = GSNAP::Result::findCiteInfo(\%citeInfo, "versions");
				if(defined $value && defined $versionOpt)
				{
					my $numResults = $versionOpt;
			 		if($versionOpt eq "all")
					{
			   			if($key =~ /All (\d+) versions/)
						{
			     			$numResults = $1;
			   			}
			 		}
					
					## Call to GS
			 		my $start = 0;
			 		if($numResults <= 100)
					{
			   			printLog("# Processed $numResults version results ...", $LOG_LEVEL, "NoNewLine");          
			   			($numVersions, $versions) = gsByUrl("http://scholar.google.com$value", "    ", $numResults, $start, $outDir, "version", $numResults);
			 		} 
					else 
					{ # Need to process multiple pages for > 100 result
			   		
						while($start < $numResults)
						{              
			     			printLog("# Processed $start/$numResults version results ...", $LOG_LEVEL, "NoNewLine");              
			     			my ($tmpNumVersions, $tmpVersions) = gsByUrl("http://scholar.google.com$value", "    ", 100, $start, $outDir, "version", $numResults);
			     			$numVersions += $tmpNumVersions;
			     			$versions .= $tmpVersions;
			     			$start += 100;
			   			}
			 		}
				} 
				else 
				{
			 		$numVersions = 0;
				}
			} 
			else 
			{
				$numVersions = 0;
			}		  

			my ($numCitedBy, $citedBy);
			if($option eq "normal")
			{### Cited by
				my ($key, $value) = GSNAP::Result::findCiteInfo(\%citeInfo, "Cited by");

				if(defined $value && defined $citedByOpt)
				{
					my $numResults = $citedByOpt;
			 		if($citedByOpt eq "all")
					{
			   			if($key =~ /Cited by (\d+)/)
						{
			     			$numResults = $1;
			   			}
			 		}

			 		## Call to GS
			 		my $start = 0;
			 		if($numResults <= 100)
					{
			   			printLog("# Processed $numResults citedBy results ...", $LOG_LEVEL, "NoNewLine");
			   			($numCitedBy, $citedBy) = gsByUrl("http://scholar.google.com$value", "    ", $numResults, $start, $outDir, "citedBy", $numResults);
			 		} 
					else 
					{ # Need to process multiple pages for > 100 result
			   			while($start < $numResults)
						{
			     			printLog("# Processed $start/$numResults citedBy results ...", $LOG_LEVEL, "NoNewLine");			      
			     			my ($tmpNumCitedBy, $tmpCitedBy) = gsByUrl("http://scholar.google.com$value", "    ", 100, $start, $outDir, "citedBy", $numResults);
			     			$numCitedBy += $tmpNumCitedBy;
			     			$citedBy .= $tmpCitedBy;
			    		 	$start += 100;
						}
			 		}
				} 
				else 
				{
					($numCitedBy, $citedBy) = (0, "");
				}
			} 
			else 
			{
				($numCitedBy, $citedBy) = (0, "");
			}

			my $gsResult = new GSNAP::Result();
			$gsResult->setPrefix($prefix);

			$gsResult->setId($id+$start);
			$gsResult->setTitle($title);
			$gsResult->setAuthor($author);
			$gsResult->setProceeding($proceeding);
			$gsResult->setYear($year);
			$gsResult->setProceedingYear($proceedingYear);
			$gsResult->setSnippet($snippet);
			$gsResult->setCiteInfo(\%citeInfo);
			$gsResult->setSource($source);
			$gsResult->setUrl($url);
			$gsResult->setPdf($pdf);
			$gsResult->setNumCitedBy($numCitedBy);
			$gsResult->setCitedBy($citedBy);
			$gsResult->setNumVersions($numVersions);
			$gsResult->setVersions($versions);

			if(!$numTitleMatch)
			{ 
				$xmlBody .= $gsResult->toXML();
			} 
			else 
			{
				if($option eq "normal" && $query ne "") 
				{
					my $queryLc = lc($query);
					my $titleLc = lc(GSNAP::Result::cleanText($title));

					my $sim = Utility::Controller::stringSim($queryLc, $titleLc);
					print STDERR "$queryLc\t$titleLc\t$sim\n";

					if($sim > $SIM_THRESHOLD)
					{
						printLog("\n# Found closely-matched title \"$title\" (vs \"$query\")", $LOG_LEVEL);		    
			   			$xmlBody .= $gsResult->toXML();
						last;
					}
				}
			}

			if ($option eq "normal")
			{
				push(@gsResults, $gsResult);
			}
			%citeInfo = ();

			$id++;

			if($id == $num)
			{
				last;
			} 
		} # end if($line =~ /^<p><div class=gs_r>(.+)<\/div>/){
	} # end for
	return ($id, $xmlBody, \@gsResults);
}

### Query GS given a base URL ###
sub gsByUrl 
{
	my ($url, $prefix, $num, $start, $outDir, $option, $total) = @_;

	my $inFile = "$outDir/citedBy/$total-$start-$option-".uri_escape($url);
	$url .= "&num=$num&start=$start";

	if(!GSNAP::Controller::verify($inFile))
	{
		GSNAP::Controller::thangSleep($WAIT_TIME, $LOG_LEVEL);
		GSNAP::Controller::callGS($url, $inFile, $LOG_LEVEL, $WAIT_TIME);
	} 
	else 
	{
		printLog("", $LOG_LEVEL);
	}

	return process($inFile, "", $prefix, $num, $start, $outDir, $option, $LOG_LEVEL, $WAIT_TIME, $SIM_THRESHOLD);
}

sub processTitleLine 
{
	my ($line, $id, $option, $LOG_LEVEL) = @_;

	my ($title, $url, $type) = (undef, undef, undef);
	if($line =~ /.*(<a .+?>.+<\/a>).*/)
	{ # there's URL accompanied with title
		($title, $url) = getContentAttribute($1, "a", "href");
	} 
	else 
	{
		if($line =~ /^<span .+>(.+)<\/span>(.+)$/)
		{
			$type = $1;#print STDERR "$1\t".cleanText($2)."\n";
			$title = $2;   
		} 
		else 
		{
			if ($LOG_LEVEL == 2)
			{
		 		print STDERR "#Warning: no title due to none or multiple <a> tags\n$line\n";
			}
			next;
		}
	}

	# Fix: remove <b> tag in Google Scholar results title, huydhn
	$title =~ s/<b>//g;	
	$title =~ s/<\/b>//g;	
	# End.

	return ($title, $url, $type);
}

sub processCitationInfo 
{
	my ($line) = @_;
}

##### Helper methods ########
sub getContentAttribute 
{
	my ($html, $tag, $attribute) = @_;

	my $text = "";
	my $attrValue = "";
	if($html =~ /^<$tag .*?$attribute=\"(.+?)\".*?>(.+)<\/$tag>$/)
	{
		$attrValue = $1;
		$text = $2;
	}

	return ($text, $attrValue);
}

sub getCiteInfo 
{
	my ($citation, $keyword) = @_;
	my ($key, $value) = (undef, undef);

	foreach(keys %{$citation})
	{
		if(/$keyword/)
		{
			($key, $value) = ($_, $citation->{$_});
			last;
		}
	}

	return ($key, $value);
}

sub printLog 
{
	my ($text, $logLevel, $option) = @_;

	if($logLevel)
	{
		print STDERR "$text";
	
		if(!defined $option || $option ne "NoNewLine")
		{
			if($logLevel == 3)
			{
		 		print STDERR "<BR>";
			}
			print STDERR "\n";
		}
	}
}

1;


