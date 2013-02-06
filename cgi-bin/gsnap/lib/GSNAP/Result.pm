package GSNAP::Result;
#
# Container object for GS result
#
# Minh-Thang Luong, 16 Sep 09
#

use strict;
use HTML::Entities;

sub new 
{
	my ($class) = @_;

	my %citeInfo = ();
	my $self = {
		'_id' 				=> undef,
		'_title' 			=> undef,
		'_author' 			=> undef,
		'_proceeding' 		=> undef,
		'_year' 			=> undef,
		'_snippet' 			=> undef,
		'_citeInfo' 		=> \%citeInfo, #reference to a hash
		'_source' 			=> undef,
		'_url' 				=> undef,
		'_pdf' 				=> undef,
		'_numVersions' 		=> undef,
		'_versions' 		=> undef,
		'_proceedingYear'	=> undef, #for compatible issue
		'_prefix' 			=> undef, #for printing purposes
		'_numCitedBy' 		=> undef,
		'_citedBy' 			=> undef
	};

	bless $self, $class;
	return $self;
} # new


##
# Looks for various combinations of data that could be used to
# uniquely identify a citation.  If too much data is missing,
# returns 0; otherwise, returns 1.
##
sub isValid 
{
	my ($self) = @_;
	my $title = $self->getTitle();

	if (defined $title) 
	{
		return 1;
	}

	return 0;
} # isValid


##
# Utility for loading in a datum based on a tag from Tr2crfpp output.
##
sub loadDataItem 
{
	my ($self, $tag, $data) = @_;

	if ($tag eq "id") 
	{
		$self->setId($data);
	}

	if ($tag eq "title") 
	{
		$self->setTitle($data);
	}

	if ($tag eq "author") 
	{
		$self->setAuthor($data);
	}

	if ($tag eq "proceeding") 
	{
		$self->setProceeding($data);
	}

	if ($tag eq "snippet") 
	{
		$self->setSnippet($data);
	}

	if ($tag eq "citeInfo") 
	{
		$self->setCiteInfo($data);
	}

	if ($tag eq "url") 
	{
		$self->setUrl($data);
	}

	if ($tag eq "pdf") 
	{
		$self->setPdf($data);
	}

	if ($tag eq "numVersions") 
	{
		$self->setNumVersions($data);
	}

	if ($tag eq "versions") 
	{
		$self->setVersions($data);
	}

	if ($tag eq "source") 
	{
		$self->setSource($data);
	}

	if ($tag eq "proceedingYear") 
	{
		$self->setProceedingYear($data);
	}

	if ($tag eq "prefix") 
	{
		$self->setPrefix($data);
	}

	if ($tag eq "numCitedBy") 
	{
		$self->setNumCitedBy($data);
	}

	if ($tag eq "citedBy") 
	{
		$self->setCitedBy($data);
	}
} # loadDataItem


##
# Returns a well-formed XML snippet containing all the data
# in a citation object.
##
sub toXML 
{
	my ($self, $option) = @_; #shift;
	my $valid = $self->isValid();
	if ($valid>0) 
	{
		$valid = "true";
	} 
	else 
	{
		$valid = "false";
	}

	my $id = $self->getId();
	my $title = $self->getTitle();
	my $author = $self->getAuthor();
	my $proceeding = $self->getProceeding();
	my $year = $self->getYear();
	#my $proceedingYear = $self->getProceedingYear();
	my $snippet = $self->getSnippet();
	my %citeInfo = $self->getCiteInfo();
	my $source = $self->getSource();
	my $prefix = $self->getPrefix();
	my $url = $self->getUrl();
	my $pdf = $self->getPdf();
	my $numVersions = $self->getNumVersions();
	my $versions = $self->getVersions();
	my $numCitedBy = $self->getNumCitedBy();
	my $citedBy = $self->getCitedBy();

	if(!defined $option || $option ne "noIndent")
	{
		$prefix .= "  ";
	}

	### Construct xml
	my $xml .= $prefix . "<result id=\"$id\">\n";
	if(defined $url) 
	{ 
		$xml .= $prefix . "  <url>".$url."</url>\n"; 
	}

	if(defined $title)
	{
		my $tmp = cleanText($title);

		# Contain elipsis or three continuous dots, incompleted information
		if (($tmp =~ m/&#8230;/) || ($tmp =~ m/\.\.\./))
		{
			$xml .= $prefix . "  <title status=\"partial\" ";
		}
		else
		{
			$xml .= $prefix . "  <title status=\"complete\" ";
		}

		# From GS with love
		$xml .= "source=\"scholar.google.com\">" . $tmp . "</title>" . "\n";
	}

	if(defined $pdf) 
	{ 
		$xml .= $prefix . "  <pdf>".$pdf."</pdf>\n"; 
	}

	if(defined $author) 
	{ 
		my $tmp = cleanText($author);

		# Contain elipsis or three continuous dots, incompleted information
		if (($tmp =~ m/&#8230;/) || ($tmp =~ m/\.\.\./))
		{
			$xml .= $prefix . "  <author status=\"partial\" ";
		}
		else
		{
			$xml .= $prefix . "  <author status=\"complete\" ";
		}

		# From GS with love
		$xml .= "source=\"scholar.google.com\">" . $tmp . "</author>" . "\n";
	}

	if(defined $proceeding) 
	{ 
		my $tmp = cleanText($proceeding);

		# Contain elipsis or three continuous dots, incompleted information
		if (($tmp =~ m/&#8230;/) || ($tmp =~ m/\.\.\./))
		{
			$xml .= $prefix . "  <proceeding status=\"partial\" ";
		}
		else
		{
			$xml .= $prefix . "  <proceeding status=\"complete\" ";
		}

		# From GS with love
		$xml .= "source=\"scholar.google.com\">" . $tmp . "</proceeding>" . "\n";
	}
	if(defined $year) 
	{ 
		$xml .= $prefix . "  <year>".cleanText($year)."</year>\n"; 
	}

	if(defined $source) 
	{ 
		$xml .= $prefix . "  <source>".cleanText($source)."</source>\n"; 
	}
	if(defined $snippet)
	{
		my $tmp = cleanText($snippet);

		# Contain elipsis or three continuous dots, incompleted information
		if (($tmp =~ m/&#8230;/) || ($tmp =~ m/\.\.\./))
		{
			$xml .= $prefix . "  <snippet status=\"partial\" ";
		}
		else
		{
			$xml .= $prefix . "  <snippet status=\"complete\" ";
		}

		# From GS with love
		$xml .= "source=\"scholar.google.com\">" . $tmp . "</snippet>" . "\n";
	}
		
	my ($key, $value);
	### Related articles
	($key, $value) = findCiteInfo(\%citeInfo, "Related articles");
	if(defined $key)
	{
		$xml .= $prefix . "  <relatedLink>http://scholar.google.com.sg".cleanText($value)."</relatedLink>\n";
	}
	
	### View as HTML
	($key, $value) = findCiteInfo(\%citeInfo, "View as HTML");
	if(defined $key)
	{
		$xml .= $prefix . "  <htmlLink>".$value."</htmlLink>\n";
	}
		
	### All ... versions
	($key, $value) = findCiteInfo(\%citeInfo, "versions");
	if(defined $key && $key =~ /^All (\d+) versions$/)
	{
		$xml .= $prefix . "  <numVersions>$1</numVersions>\n";
		$xml .= $prefix . "  <versionLink>http://scholar.google.com.sg".$value."</versionLink>\n";
	}

	if(defined $versions) 
	{ 
		$xml .= $prefix . "  <versions totalResults=\"$numVersions\">\n";
		my @tokens = split(/\|\|\|/, $versions);
		my $id = 0;
		foreach my $version (@tokens)
		{
			if($version eq "") { next; }
			$xml .= $prefix . "    <result id=\"$id\">".$version."</result>\n";
			$id++;
		}
		$xml .= $prefix . "  </versions>\n"; 
	}

	### Cited by
	($key, $value) = findCiteInfo(\%citeInfo, "Cited by");
	if(defined $key && $key =~ /^Cited by (\d+)$/)
	{
		$xml .= $prefix . "  <numCite>$1</numCite>\n";
		$xml .= $prefix . "  <citeLink>http://scholar.google.com.sg".$value."</citeLink>\n";
	} 
	
	if(!defined $numCitedBy) {$numCitedBy = 0;}
	$xml .= $prefix . "  <citedBy totalresults=\"$numCitedBy\">\n";
	if(defined $citedBy && $citedBy ne "") { $xml .= $prefix . $citedBy; }
	$xml .= $prefix . "  </citedBy>\n";
			
	$xml .= $prefix . "</result>\n";
	return $xml;
} # toXML

##
# Returns a well-form XML for ForeCite ingestion
##
sub toForeCite 
{
	my ($self) = @_; #shift;
	my $id = $self->getId();
	my $title = $self->getTitle();
	my $authorStr = $self->getAuthor();
	my $proceeding = $self->getProceeding();
	my $year = $self->getYear();
	my $url = $self->getUrl();
	my $pdf = $self->getPdf();
	my $prefix .= "  ";

	### Construct xml
	my $bibType = "misc";
	if($proceeding =~ /proceeding/i)
	{
		$bibType = "inproceedings";
	}

	my $xml .= $prefix . "<$bibType key=\"$id\">\n";
	if(defined $title)
	{
		$xml .= $prefix . "  <title>".cleanText($title)."</title>\n";
	}

	if(defined $url) 
	{ 
		$xml .= $prefix . "  <url>".$url."</url>\n"; 
	}

	if(defined $pdf) 
	{ 
		$xml .= $prefix . "  <pdf>".$pdf."</pdf>\n"; 
	}

	if(defined $authorStr) 
	{ 
		my @authors = ();
		getIndividualAuthors(cleanText($authorStr), \@authors);
		for my $author (@authors)
		{
			$xml .= $prefix . "  <author>".cleanText($author)."</author>\n";
		}
	}

	if(defined $proceeding && $proceeding !~ /(\.com|\.edu|\.org)/ && $proceeding !~ /\w{2,4}\.\w{2,4}\.\w{2,4}/) 
	{ 
		my $proceedingType = "booktitle";
		if($proceeding =~ /journal/i)
		{
			$proceedingType = "journal";
		}
		$xml .= $prefix . "  <$proceedingType>".cleanText($proceeding)."</$proceedingType>\n"; 
	}
	
	if(defined $year && $year =~ /\d\d/) 
	{ 
		$xml .= $prefix . "  <year>".cleanText($year)."</year>\n"; 
	}
	
	$xml .= $prefix . "</$bibType>\n";
	return $xml;
} # toXML

###
# Output to the format that could be processed by AAN package
###
sub toAAN {
	my ($self) = @_; #shift;
	my $id = $self->getId();
	my $title = $self->getTitle();
	my $author = $self->getAuthor();
	my $proceeding = $self->getProceeding();
	my $year = $self->getYear();

	### Construct AAN output
	my $aan .= "id = {$id}\n";
	my @authors = ();
	getIndividualAuthors(cleanText($author), \@authors);
	$aan .= "author = {".join("; ", @authors)."}\n";
	$aan .= "title = {".cleanText($title)."}\n";
	$aan .= "venue = {".cleanText($proceeding)."}\n"; 
	$aan .= "year = {".cleanText($year)."}\n"; 

	return $aan;
} # toXML

# Preprocess & break into multiple authors
sub getIndividualAuthors 
{
	my ($authors, $authorArray) = @_;

	# Preprocess & break into multiple authors
	my @authors = split(/\s*[,.]\s*/, $authors);
	foreach my $author (@authors)
	{
		if($author =~ /\.\.\./ || $author =~ /\./ || $author eq "")
		{ # discard incomplete author
			next;
		}

		my @tokens = split(/\s+/, $author);
		my $numTokens = scalar(@tokens);
		$author = $tokens[-1].", ".join(" ", @tokens[0..($numTokens-2)]);
		push(@{$authorArray}, $author);
	}
}

sub findCiteInfo 
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

sub cleanText 
{
	my ($text) = @_;

	# Handle XML entities	
	$text =~ s/&hellip;/&#8230;/g; # convert &hellip; to the xml entitity...
	#$text =~ s/\x{0093}/&#8220;/g; # convert to the xml entitity of ldquo "
	#$text =~ s/\x{0094}/&#8221;/g; # convert to the xml entitity of rdquo "

	$text =~ s/<.+?>//g; # remove tag
	$text =~ s/^\s+//; # strip leading spaces
	$text =~ s/\s+$//; # strip trailing spaces
	$text =~ s/  +/ /g; # remove double spaces 

	$text =~ s/>/&gt;/g;
	$text =~ s/</&lt;/g;
	$text =~ s/\"/&quot;/g;
	$text =~ s/\'/&apos;/g;

	return $text;
}

###### Getters and setters #######
sub getId 
{
	my ($self) = @_;
	return $self->{'_id'};
}

sub setId 
{
	my ($self, $id) = @_;
	$self->{'_id'} = $id;
}

sub getTitle 
{
	my ($self) = @_;
	return $self->{'_title'};
}

sub setTitle 
{
	my ($self, $title) = @_;
	$self->{'_title'} = $title;
}

sub getAuthor 
{
	my ($self) = @_;
	return $self->{'_author'};
}

sub setAuthor 
{
	my ($self, $author) = @_;
	$self->{'_author'} = $author;
}

sub getProceeding 
{
	my ($self) = @_;
	return $self->{'_proceeding'};
}

sub setProceeding 
{
	my ($self, $proceeding) = @_;
	$self->{'_proceeding'} = $proceeding;
}

sub getYear 
{
	my ($self) = @_;
	return $self->{'_year'};
}

sub setYear 
{
	my ($self, $year) = @_;
	$self->{'_year'} = $year;
}

sub getSnippet 
{
	my ($self) = @_;
	return $self->{'_snippet'};
}

sub setSnippet 
{
	my ($self, $snippet) = @_;
	$self->{'_snippet'} = $snippet;
}

sub getCiteInfo 
{
	my ($self) = @_;
	return %{$self->{'_citeInfo'}};
}

sub setCiteInfo 
{
	my ($self, $otherCiteInfo) = @_;
	my %citeInfo = %{$self->{'_citeInfo'}};
	foreach my $key (keys %{$otherCiteInfo})
	{
		$citeInfo{$key} = $otherCiteInfo->{$key};
	}
	$self->{'_citeInfo'} = \%citeInfo;
}

sub getSource 
{
	my ($self) = @_;
	return $self->{'_source'};
}

sub setSource 
{
	my ($self, $source) = @_;
	$self->{'_source'} = $source;
}

sub getUrl 
{
	my ($self) = @_;
	return $self->{'_url'};
}

sub setUrl 
{
	my ($self, $url) = @_;
	$self->{'_url'} = $url;
}

sub getPdf 
{
	my ($self) = @_;
	return $self->{'_pdf'};
}

sub getVersions 
{
	my ($self) = @_;
	return $self->{'_versions'};
}

sub setPdf 
{
	my ($self, $pdf) = @_;
	$self->{'_pdf'} = $pdf;
}

sub getNumVersions 
{
	my ($self) = @_;
	return $self->{'_numVersions'};
}

sub setNumVersions 
{
	my ($self, $numVersions) = @_;
	$self->{'_numVersions'} = $numVersions;
}

sub setVersions 
{
	my ($self, $versions) = @_;
	$self->{'_versions'} = $versions;
}

sub getProceedingYear 
{
	my ($self) = @_;
	return $self->{'_proceedingYear'};
}

sub setProceedingYear 
{
	my ($self, $proceedingYear) = @_;
	$self->{'_proceedingYear'} = $proceedingYear;
}

sub getPrefix 
{
	my ($self) = @_;
	return $self->{'_prefix'};
}

sub setPrefix 
{
	my ($self, $prefix) = @_;
	$self->{'_prefix'} = $prefix;
}

sub getNumCitedBy 
{
	my ($self) = @_;
	return $self->{'_numCitedBy'};
}

sub setNumCitedBy 
{
	my ($self, $numCitedBy) = @_;
	$self->{'_numCitedBy'} = $numCitedBy;
}

sub getCitedBy 
{
	my ($self) = @_;
	return $self->{'_citedBy'};
}

sub setCitedBy 
{
	my ($self, $citedBy) = @_;
	$self->{'_citedBy'} = $citedBy;
}

1;



