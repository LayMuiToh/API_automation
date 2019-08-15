#!/usr/bin/awk -f 

# Set field separator as comma for csv and print the HTML header line
BEGIN {
    FS=",";
    print "<!DOCTYPE html>"
    print "<html><head><title></title>"
    print "<meta http-equiv=\"Content-Style-Type\" content=\"text/css\">"
    print "<style type=\"text/css\"><!--"
    print "body {"
    print "  margin: 5px 5px 5px 5px;"
    print "  background-color: #ffffff;"
    print "}"

    print "/* ========== Text Styles ========== */"
    print "hr { color: #000000}"
    print "body, table /* Normal text */"
    print "{"
    print "\tfont-size: 10pt;"
    print "\tfont-family: 'Courier New';"
    print "\tfont-style: normal;"
    print "\tfont-weight: normal;"
    print "\tcolor: #000000;"
    print "\ttext-decoration: none;"
    print "}"
    print "span.rvts1 /* Heading */"
    print "{"
    print "\tfont-family: 'Serif';"
    print "\tfont-weight: bold;"
    print "\tcolor: #0000ff;"
    print "}"
    print "span.rvts2 /* Subheading */"
    print "{"
    print "\tfont-family: 'Serif';"
    print "\tfont-weight: bold;"
    print "\tcolor: #000080;"
    print "}"
    print "span.rvts3 /* Keywords */"
    print "{"
    print "\tfont-family: 'Serif';"
    print "\tfont-style: italic;"
    print "\tcolor: #800000;"
    print "}"
    print "a.rvts4, span.rvts4 /* Jump 1 */"
    print "{"
    print "\tcolor: #008000;"
    print "\ttext-decoration: underline;"
    print "}"
    print "a.rvts5, span.rvts5 /* Jump 2 */"
    print "{"
    print "\tfont-family: 'Serif';"
    print "\tcolor: #008000;"
    print "\ttext-decoration: underline;"
    print "}"
    print ".pass/* PASS */"
    print "{"
    print "\tfont-family: 'Serif';"
    print "\tbackground-color: #31d47a;"
    print "}"
    print ".fail/* FAIL */"
    print "{"
    print "\tfont-family: 'Serif';"
    print "\tbackground-color: #f7430c;"
    print "\tcolor: #ffffff;"
    print "}"
    print "/* ========== Para Styles ========== */"
    print "p,ul,ol /* Paragraph Style */"
    print "{"
    print "\ttext-align: left;"
    print "\ttext-indent: 0px;"
    print "\tpadding: 0px 0px 0px 0px;"
    print "\tmargin: 0px 0px 0px 0px;"
    print "}"
    print ".rvps1 /* Centered */"
    print "{"
    print "\ttext-align: center;"
    print "}"
    print "--></style>"
    print "</head>"
    print "<body>"
    print "<p><br></p>"
    print "<div><table width=\"100%\" border=1 cellpadding=1 cellspacing=2 style=\"background-color: #ffffff;\">"
}


# Function to print the header
function printHeader() {
    print "<tr valign=top>"
    for(i=1; i<=NF; i++) {
        if (i==NF) #last column only 10%
            print "<td style=\"border-style: inset;background-color: #f7ed81; width:10%\">";
        else
    	    print "<td style=\"border-style: inset;background-color: #f7ed81;\">";
    	print "<p><span class=rvts1>"$i"</span></p>";
    	print "</td>";
    }
    print "</tr>"
}

# Function to print a row 
function printRow() {
    print "<tr valign=top>"
    for(i=1; i<=NF; i++) {
       print "<td style=\"border-style: inset;\">";
        if (( $i == "PASS") || ( $i ~ /^% Pass*/))
            print "<p class=\"pass\">"$i"</p>";
        else if (( $i == "FAIL") || ( $i ~ /^% Fail*/))
	        print "<p class=\"fail\">"$i"</p>";
        else 
            print "<p>"$i"</p>";
    	print "</td>";
    }
    print "</tr>"
}

# Function to print the footer
function printFooter() {
      print "<tr valign=top>"
      print "<td style=\"border-style: inset;\"><br>"
      print "</td>"
      print "<td style=\"border-style: inset;\"><br>"
      print "</td>"
      print "<td style=\"border-style: inset;\"><br>"
      print "</td>"
      print "<td style=\"border-style: inset;\"><br>"
      print "</td>"
      print "<td style=\"border-style: inset;\"><br>"
      print "</td>"
      print "<td style=\"border-style: inset;\">"
      print "<p>% Pass: $i</p>"
      print "</td>"
      print "</tr>"
}

# If CSV file line number (NR variable) is 1, call printHeader function
NR==1 {
    printHeader()
}
# If CSV file line number (NR variable) is greater than 1, call printRow
NR>1 {
    printRow()
}
# Print HTML footer
END {
    print "</table></div></body></html>"
}
