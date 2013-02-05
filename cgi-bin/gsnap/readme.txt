
Edited by Dongyuan from inital version

1. GSNAP/Controller.pm   378  change "sleep" to system("ping -n $sleepTime 127.0.0.1 >nul");   #for windows 
2. bin/query_gscholar.pl  160 change $ENV{'PATH'} = '/bin:/usr/bin:/usr/local/bin';  to   $ENV{'PATH'} = '/bin;/usr/bin;/usr/local/bin;C:/Windows/system32';
3. GSNAP/Controller.pm   165  my $numLines = `wc -l < $inFile`;
	to	my $numLines = 0;
4. bin/query_gscholar.pl   82 83    change my $time = `date +%s `; chomp($time);
	my $date = `date`; chomp($date);   to     	my $time = "9:00";
	my $date = "2013";
5. Controller.pm   289    change	if($content =~ /<html><head><meta http-equiv/)   to 	if($content =~ /<html><head>/)





Usually used command: 

1. debug

perl.exe -d -T bin/query_gscholar.pl -citedBy all -query "author:\"Dongyuan Lu\"" -out lu.xml -dir cache/gs/ -n all -fromYear 2000 -toYear 2011

2. execute query author

perl.exe -T bin/query_gscholar.pl -citedBy all -query "author:\"Dongyuan Lu\"; title" -out lu.xml -dir cache/gs/ -n all -fromYear 2000 -toYear 2011

3. 
perl.exe -T bin/query_gscholar.pl -citedBy all -query "author:\"Dongyuan Lu\"" -out lu.xml -dir cache/gs/ -n all -fromYear 2000 -toYear 2011

4.
perl.exe -T bin/query_gscholar.pl -citedBy all -query "allintitle: \"Simfinder: A flexible clustering tool for summarization\"" -out cimfinder.xml -dir cache/gs/ -n 1



perl.exe -T gsnap/bin/query_gscholar.pl -citedBy all -in "../data/gs-query.temp" -out "../data/publication/pub_01001.xml" -dir "./gsnap/cache/gs/" -n all


##query example
#system("c:/perl/bin/perl.exe -T gsnap/bin/query_gscholar.pl -query \"author:\\\"Kan Min Yen\\\"\" -out " . $output . " -dir ./gsnap/cache/gs/ -n all -fromYear 2000 -toYear 2011");


