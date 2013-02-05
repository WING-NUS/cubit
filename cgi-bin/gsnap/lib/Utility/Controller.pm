package Utility::Controller;
#
# This package is used to ...
#
# Minh-Thang Luong 03 June 09
#
use strict;

#### List methods ###
# checkDir
# getNumLines
# getFilesInDir
# loadListHash
# loadListArray
# sequenceSim
# max
# getIdentityStr
# normalDistributionSet
# normalDistribution
# printHashAlpha
# printHashKeyAlpha
# printHashNumeric
# printHashKeyNumeric
# outputHashNumeric
# outputHashKey
# outputHashKeyNumeric
# outputHashKeySTDERR
# lowercase
# execute
# execute1
# newTmpFile
#####################


# checkDir
sub checkDir {
  my ($outDir) = @_;

  if(-d $outDir){
    print STDERR "#! Directory $outDir exists!\n";
  } else {
    print STDERR "# Directory $outDir does not exist! Creating ...\n";
    execute("mkdir -p $outDir");
  }
}

# generate a hash of $n int random value btw [$min, $max]
sub getHashRandom {
  my ($n, $min, $max, $index) = @_;

  if($max < $min){
    die "Die: max $max < min $min\n";
  }

  if($n > ($max - $min + 1)){
    die "Die: can't generate $n distinct values in range [$min, $max]\n";
  }

  my $count = 0;
  my $upper = $min - 1;
  while($count < $n){
    my $num = $min + int(rand($max-$min+1)); #generate values in [0, $max-$min]
    if(!$index->{$num}){
      $index->{$num} = 1;
      $count++;
      
      if($num > $upper){
	$upper = $num;
      }
    }
  }

  return $upper;
}

# get the number of lines in a file
sub getNumLines {
  my ($inFile) = @_;

  ### Count & verify the totalLines ###
  chomp(my $tmp = `wc -l $inFile`);
  my @tokens = split(/ /, $tmp);
  return $tokens[0];
}

### Get a list of files in the provided directory, and sort them alphabetically###
sub getFilesInDir{
  my ($inDir, $files, $pattern) = @_;

  if(!-d $inDir) {
    die "Die: directory $inDir does not exist!\n";
  }
  
  if(!defined $pattern){
    $pattern = "";
  }

#  opendir DIR, $inDir or die "cannot open dir $inDir: $!";
#  my @files= grep { $_ ne '.' && $_ ne '..' && $_ !~ /~$/} readdir DIR;
#  closedir DIR;
  my $line = `find $inDir -type f`;
  my @tokens = split(/\s+/, $line);
  my @tmpFiles = ();
  foreach my $token (@tokens){
    if($token ne "" && $token !~ /^\.$/ && $token !~ /^\.\.$/ && $token !~ /~$/ && $token =~ /$pattern/){
      push(@tmpFiles, $token);
    }
  }

  my @sorted_files = sort { $a cmp $b } @tmpFiles;
  @{$files} = @sorted_files;
}

sub loadListHash {
  my ($inFile, $hash) = @_;

  open(IF, "<:utf8", $inFile) || die "#Can't open file \"$inFile\"";

  print STDERR "# Loading $inFile ";
  my $count = 0;
  while(<IF>){ 
    chomp;
    
    my @tokens = split(/\s+/, $_);
    $hash->{$tokens[0]} = 1;
    $count++;
    if($count % 1000 == 0){
      print STDERR ".";
    }
  }
  print STDERR " - Done! Total lines read = $count\n";
  close IF;
}

sub loadListArray {
  my ($inFile, $array) = @_;

  open(IF, "<:utf8", $inFile) || die "#Can't open file \"$inFile\"";

  my $count = 0;
  while(<IF>){ 
    chomp;

    $array->[$count++] = $_;
  }

  close IF;
}

##
## stringSim($str1, $str2) ##
# Compute similarity between 2 strings
# by computing the longest common subsequence
# of their two sequence of chars/words depending on split pattern (default is chars)
##
sub stringSim {
  my ($str1, $str2, $pattern) = @_;

  if(!defined $pattern){
    $pattern = "";
  }

  my @seq1 = split(/$pattern/, $str1);
  my @seq2 = split(/$pattern/, $str2);

  my $sim = sequenceSim(\@seq1, \@seq2);
  return $sim;
}

# Longest common subsequence
# compute similarity score between two sequences
# complexiy O(mn), m and n are the lengths of the two sequences
sub sequenceSim{
  my($seq1, $seq2) = @_;
  my $l1 = @{$seq1};

  my $l2 = @{$seq2};

  my @numMatches = ();

  # initialization
  for(my $i=0; $i<=$l1; $i++){
    push(@numMatches, []);
    for(my $j=0; $j<=$l2; $j++){
      $numMatches[$i]->[$j] = 0;
    }
  }

  # dynamic programming
  for(my $i=1; $i<=$l1; $i++){
    push(@numMatches, []);
    for(my $j=1; $j<=$l2; $j++){
      if($seq1->[$i-1] eq $seq2->[$j-1]){
	$numMatches[$i]->[$j] = 1 + $numMatches[$i-1]->[$j-1];
      }
      else {
	$numMatches[$i]->[$j] = $numMatches[$i-1]->[$j] > $numMatches[$i]->[$j-1] ?
	  $numMatches[$i-1]->[$j] : $numMatches[$i]->[$j-1];
      }
    }
  }
  
  my $sim = sprintf("%.3f", $numMatches[$l1]->[$l2]/max($l1, $l2));
  return $sim;
}

#2-argument
sub max {
  my ($a, $b) = @_;
  return ($a > $b) ? $a : $b;
}

sub getIdentityStr {
  my ($dir) = @_;

  if($dir eq ""){
    $dir = `pwd`;
    chomp($dir);
  }

  my $identityStr="";
  if($ENV{HOSTNAME} =~ /^(.+?)\./){
    $identityStr .= "$1 ";
  }
  my $date=`date`;
  $identityStr .= "$date\t$dir";

  return $identityStr;
}

sub normalDistributionSet {
  my ($numbers) = @_;

  my $count = scalar(@{$numbers});
  my $sum = 0;
  my $squareSum = 0;
  foreach(@{$numbers}){
    $sum += $_;
    $squareSum += ($_*$_);
  }
  return normalDistribution($sum, $squareSum, $count);
}

  
##
## normalDistribution($sum, $squareSum, $count) ##
#
# sum: the total sum of all element values
# squareSum: the total sum of squares of all element values
# count: num of elements
##
sub normalDistribution {
  my ($sum, $squareSum, $count) = @_;

  my $mean = $sum / $count;
  my $stddev = 0;
  if($count < 2) {
    $stddev = sqrt(($squareSum - $count*$mean*$mean)/ $count);
  } else {
    $stddev = sqrt(($squareSum - $count*$mean*$mean)/ ($count - 1));
  }

  return ($mean, $stddev);
}

sub printHashAlpha{
  my ($hash, $topN, $name) = @_;

  if(!defined $name){
    $name = "hash";
  }
  print STDERR "Output $name\n";

  my @sorted_keys = sort {$a cmp $b} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print STDOUT "$_\t$hash->{$_}\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
}

sub printHashNumeric{
  my ($hash, $topN, $name) = @_;

  if(defined $name){
    print STDERR "Output $name\n";
  }

  my @sorted_keys = sort {$a <=> $b} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print STDOUT "$_\t$hash->{$_}\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
}

sub printHashKeyAlpha{
  my ($hash, $topN, $name) = @_;

  if(!defined $name){
    $name = "hash keys";
  }
  print STDERR "Output $name\n";

  my @sorted_keys = sort {$a cmp $b} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print STDOUT "$_\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
}

sub printHashKeyNumeric{
  my ($hash, $topN, $name) = @_;

  if(!defined $name){
    $name = "hash keys";
  }
  print STDERR "Output $name\n";

  my @sorted_keys = sort {$hash->{$b} <=> $hash->{$a}} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print STDOUT "$_\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
}

sub outputHashNumeric{
  my ($outFile, $hash, $topN, $name) = @_;

  if(!defined $name){
    $name = "hash keys";
  }
  print STDERR "Output $name to $outFile\n";
  open(OF, ">:utf8", $outFile) || die "#Can't open file \"$outFile\"";

  my @sorted_keys = sort {$hash->{$b} <=> $hash->{$a}} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print OF "$_\t$hash->{$_}\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
  close OF;
}

sub outputHashKeyNumeric{
  my ($outFile, $hash, $topN, $name) = @_;

  if(defined $name){
    print STDERR "Output $name to $outFile\n";
  }
  open(OF, ">:utf8", $outFile) || die "#Can't open file \"$outFile\"";

  my @sorted_keys = sort {$a <=> $b} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print OF "$_\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
  close OF;
}

##
# sub outputHashKey($hash, $outFile, $name)
# print all keys of the hash to the outFile ($name is used for logging purpose).
##
sub outputHashKey {
  my ($hash, $outFile, $topN, $name) = @_;

  if(!defined $name){
    $name = "hash keys";
  }
  print STDERR "Output $name to $outFile\n";
  open(OF, ">:utf8", $outFile) || die "#Can't open file \"$outFile\"";

  my @sorted_keys = sort {$a cmp $b} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print OF "$_\n";

    $count++;
    if($count == $topN){
      last;
    }
  }
  close OF;
}

##
# sub outputHashKey($hash, $outFile, $name)
# print all keys of the hash to the outFile ($name is used for logging purpose).
##
sub outputHashKeySTDERR {
  my ($hash, $topN) = @_;

  my @sorted_keys = sort {$a cmp $b} keys %{$hash};
  my $count = 0;
  foreach(@sorted_keys){
    print STDERR "$_\t";

    $count++;
    if($count == $topN){
      last;
    }
  }
  print STDERR "\n";
}

sub lowercase {
  my ($inFile) = @_;

  if(!(-e "$inFile.lowercased")){
    execute1("$ENV{SMT_HOME}/scripts/lowercase.perl < $inFile > $inFile.lowercased");
  }

~  return "$inFile.lowercased";
}

sub untaintPath {
  my ($path) = @_;

  if ( $path =~ /^([-_\/\w\.\d:]+)$/ ) {
    $path = $1;
  } else {
    die "Bad path $path\n";
  }

  return $path;
}

sub untaint {
  my ($s) = @_;
  if ($s =~ /^([\w \-\@\(\),\.\/<>]+)$/) {
    $s = $1;               # $data now untainted
  } else {
    die "Bad data in $s";  # log this somewhere
  }
  return $s;
}

sub execute {
  my ($cmd) = @_;
  print STDERR "Executing: $cmd\n";
  $cmd = untaint($cmd);
  system($cmd);
}

sub execute1 {
  my ($cmd) = @_;
  $cmd = untaint($cmd);
  #print STDERR "Executing: $cmd\n";
  system($cmd);
}

sub newTmpFile {
  my $tmpFile = `date '+%Y%m%d-%H%M%S-$$'`;
  chomp($tmpFile);
  return $tmpFile;
}

sub GetNodeAttr 
{
	my ($node, $attr) = @_;
	return ($node->att($attr) ? $node->att($attr) : "");
}

sub SetNodeAttr 
{
	my ($node, $attr, $value) = @_;
	$node->set_att($attr, $value);
}

sub GetNodeText
{
	my ($node) = @_;
	return $node->text;
}

sub SetNodeText
{
	my ($node, $value) = @_;
	$node->set_text($value);
}

sub UntaintYear
{
	my ($year) = @_;

	if ($year =~ /^([12]\d{3})$/)
	{
		$year = $1;
		return $year;
	}
	else
	{
		die "Bad year number $year \n";
	}
}

sub UntaintPath 
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

1;
