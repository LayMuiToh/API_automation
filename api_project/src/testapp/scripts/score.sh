#!/usr/bin/env bash

display_usage() {
  echo "Usage: $0 <csv filepath>"
  TIMESTAMP=`date +"%Y%m%d_%H%M%S"`
  REPORT_DIR="../Report/$TIMESTAMP"
  echo "Example: $0 $REPORT_DIR/wss-voice.$TIMESTAMP.csv"
}

if [[ $# -ne 2 ]]
then
  echo "Expected 2 arguments to be present"
  display_usage
  exit 1
fi

CSV_FILE=$1
MODE=$2
if [ ! -f "$CSV_FILE" ]; then
   echo "$CSV_FILE" does not exist
   exit 1
fi
numFail=`grep 'FAIL' $CSV_FILE | grep -c 'FAIL'`
numFail=`expr $numFail`
numPass=`grep -E 'PASS.*PASS' $CSV_FILE | wc -l`
numPass=`expr $numPass`
numTotal=`cat $CSV_FILE | wc -l`
numTotal=`expr $numTotal - 1`
if [ $numTotal -ne 0 ];
then
   PercentFail=`awk -v var1=$numFail -v var2=$numTotal 'BEGIN { print  ( var1 / var2 * 100) }'`
   PercentPass=`awk -v var1=$numPass -v var2=$numTotal 'BEGIN { print  ( var1 / var2 * 100) }'`
else
   PercentFail=0
   PercentPass=0
fi

if [ "$MODE" == "TEXT" ];
then
  echo ",,% Fail: $PercentFail" >> $CSV_FILE
  echo ",,% Pass: $PercentPass" >> $CSV_FILE
else
  echo ",,,,,,,% Fail: $PercentFail" >> $CSV_FILE
  echo ",,,,,,,% Pass: $PercentPass" >> $CSV_FILE
fi