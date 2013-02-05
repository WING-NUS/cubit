#!c:\perl\bin\perl.exe
use strict;
use warnings;
use CGI;
use XML::Simple;

my $mainConfigPath = "../data/config/config_1.xml"; ##main config file!

my $cgi = CGI -> new();
print $cgi -> header();
open(STDERR,">>../data/gsnap_pl.log") || die "can't open $!"; #recording Log info
my $xs = XML::Simple -> new();
getPub($mainConfigPath);


#Main Method
sub getPub
{
	my ($configPath) = @_;
	my $readXml = $xs -> XMLin($configPath, KeyAttr => {}, ForceArray => ['member']);
	
	##if config group
	if($readXml->{type} eq "group") 
	{
		for(my $index = 0; defined $readXml->{members}->{member}->[$index]; $index++)
		{	
			my $mm = $readXml->{members}->{member}->[$index];
			my $mId = $mm->{id};		
			my $mType = $mm->{type};
			my $m_name = $mm->{name};
			my $m_ins = $mm->{affiliation};
			my $p_config = "../data/config/config_$mId.xml";
			my $needVerify = $mm->{needVerify};
			
			print "Processing $mId ...\n";
			if( $mType eq "person") ##if member is person
			{	
				##check whether publication.xml already exists
				if(not -r "../data/publication/pub_$mId.xml") ##if not
				{
					##check whether need person verify; default: false
					##if "true", read person config file;
					if(defined $needVerify && $needVerify eq "true")
					{	
						print "crawlGSVerified $mId...\n";
						crawlGSVerified($p_config);
						
					}
					## if "false", only use author name as query to GS
					elsif((defined $needVerify && $needVerify eq "false") || not defined $needVerify)
					{
						print "crawlGSAuthor $mId...\n";
						crawlGSAuthor($m_name,$m_ins,$readXml,$mId);
					}
					else
					{
						print STDERR "<members><member needVerify> should be \"true\" (need verify) or \"false\" (not need verify)\n";
					}
				}				
			}
			elsif($mType eq "group") ##if member is group
			{
				getPub($p_config);
			}
			else
			{
				print STDERR "<members><member type> should be \"group\" or \"person\"\n";
			}
		}
	}
	
	##else if config person
	elsif(($readXml->{type} eq "person") || not -r $configPath)
	{	
		crawlGSVerified($configPath);
	}
	
	else
	{
		print STDERR "<config type> should be \"group\" or \"person\"\n";
	}
}


##Crawl Google Scholar only by author name
#Input:
	#$authorName: the author's name
	#$xml: the main config xml 
	#$id: person's id
#Output:
	#pub_id.xml recording the author's publication
sub crawlGSAuthor
{
	my ($authorName,$ins,$xml,$id) = @_;
	my $cmd = $xml->{perl_src}." "
				.$xml->{mthd}." "
				.$xml->{gsnap_src}." "
				."-out \"../data/publication/pub_$id.xml\" ";
	#add query author
	$cmd .= "-query \"author:\\\"$authorName\\\" $ins\" ";			
	
	#parse citedBy
	if( ref($xml->{citedBy}) ne "HASH")  
	{
		$cmd .= "-citedBy " . $xml->{citedBy} . " ";
	}			

	#parse dir			
	if( ref($xml->{dir}) ne "HASH") 
	{
		$cmd .= "-dir \"".$xml->{dir}."\" ";
	}
	else
	{
		$cmd .= "-dir \"./gsnap/cache/gs/\" ";
	}

	#parse n
	if( ref($xml->{n}) ne "HASH")  
	{
		$cmd .= "-n ".$xml->{n}." ";
	}
	else
	{
		$cmd .= "-n all ";  #default n
	}

	#parse fromYear
	if( ref($xml->{fromYear}) ne "HASH")  
	{
		$cmd .= "-fromYear ".$xml->{fromYear}." ";
	}

	#parse toYear
	if( ref($xml->{toYear}) ne "HASH") 
	{
		$cmd .= "-toYear ".$xml->{toYear}." ";
	}

	system($cmd);
}


##Crawl Google Scholar by reading person's config file
#Input:
	#$configPath:
#Output:
	#pub_id.xml recording the person's publication
sub crawlGSVerified
{
	my ($configPath) = @_;
	my $refxml = $xs -> XMLin($configPath, KeyAttr => {},ForceArray => ['title']);

	open(QUERY,">../data/gs-query.temp") || die "can't open $!";

	#write query-author into query-file
	if( ref($refxml->{query}->{author}) ne "HASH")
	{
		print QUERY "author:\"" . $refxml->{query}->{author} . "\" ". $refxml->{affiliation};
	}

	#write query-titles into query-file
	for(my $index = 0; defined $refxml->{query}->{titles}->{title}->[$index]; $index++)
	{
		if( ref($refxml->{query}->{titles}->{title}->[$index]) ne "HASH")
		{
			if( ref($refxml->{query}->{author}) ne "HASH" || $index > 0){
				print QUERY "\n";
			}
			print QUERY "\rallintitle: \"" . $refxml->{query}->{titles}->{title}->[$index] . "\"";
		}
	}

	my $m_id = $refxml->{id};
#	print "$m_id\n";
	my $command = getCmd($refxml,$m_id);
#	print "$command\n";
	system($command);

}



#Generate $cmd
sub getCmd
{	
	my ($xml,$id) = @_;
	my $cmd = $xml->{perl_src}." "
				.$xml->{mthd}." "
				.$xml->{gsnap_src}." "
				."-in \"../data/gs-query.temp\" "
				."-out \"../data/publication/pub_$id.xml\" ";

	#parse citedBy
	if( ref($xml->{citedBy}) ne "HASH")  
	{
		$cmd .= "-citedBy " . $xml->{citedBy} . " ";
	}			

	#parse dir			
	if( ref($xml->{dir}) ne "HASH") 
	{
		$cmd .= "-dir \"".$xml->{dir}."\" ";
	}
	else
	{
		$cmd .= "-dir \"./gsnap/cache/gs/\" ";
	}

	#parse n
	if( ref($xml->{n}) ne "HASH")  
	{
		$cmd .= "-n ".$xml->{n}." ";
	}
	else
	{
		$cmd .= "-n all ";  #default n
	}

	#parse fromYear
#	if( ref($xml->{fromYear}) ne "HASH")  
#	{
#		$cmd .= "-fromYear ".$xml->{fromYear}." ";
#	}

	#parse toYear
#	if( ref($xml->{toYear}) ne "HASH") 
#	{
#		$cmd .= "-toYear ".$xml->{toYear}." ";
#	}
	
	return $cmd;
}



