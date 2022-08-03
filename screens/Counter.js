import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, Button } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import getSpikesFromAccelerometer from '../utils/StepCalculator';
import CircularProgress from 'react-native-circular-progress-indicator';
import { Line, G } from 'react-native-svg'
import Speedometer, {Background, Arc, Needle, Progress, Marks, Indicator,
} from 'react-native-cool-speedometer';
import { Card, CardTitle, CardContent, CardAction, CardButton, CardImage } from 'react-native-material-cards'
import exerciseImg from '../image/exercise2.png';
import ProgressBar from 'react-native-progress/Bar';
import { FontAwesome5 } from '@expo/vector-icons';



export default function Counter() {
 const [completionCount, setCompletionCount] = useState(0);
 const [counter, setCounter] = useState(3); //(180 3 mins)

 const [currentScreen, setCurrentScreen] = useState('counter');
useEffect(()=>{
  if (currentScreen == 'counter'){
    if (completionCount == 1){
     setCurrentScreen('break');
     console.log('completionCount:',completionCount)
    }
  }
},[completionCount]);

 useEffect(() => {
  counter > 0 && setTimeout(() => {    
    //completionCount is how many timme the user have done 30 steps. In This case, after the first 30 steps the progress bar keep progressing
    if (currentScreen == 'break'){
      if(counter == 1 ){
        setCurrentScreen('counter');
        setStepCount(0);
      }
      setCounter(counter - 1);
    }
  }, 1000);
}, [counter, currentScreen]);


//  const [timer, setTimer] = useState('3:00');

//  const [secondsLeft, setSecondsLeft] = useState (180);
//  const [timerOn, setTimerOn] = useState(false);

//  useEffect(()=>{
// if(timerOn) startTimer();
// else{
//   BackgroundTimer.stopBackgroundTimer();

//   return() =>{
//     BackgroundTimer.stopBackgroundTimer();
//   };
// }},[timerOn]);

// useEffect(()=>{
//   if (secondsLeft === 0){
//     BackgroundTimer.stopBackgroundTimer();
//   }
// }, [secondsLeft]);

// const  startTimer = () => {
//   BackgroundTimer.runBackgroundTimer(()=>{
//     setSecondsLeft(secs =>{
//       if(secs > 0) return secs -1
//       else return 0;

//     })
//   }, 1000)
// }

 const clockify = () =>{
  let hours = Math.floor(counter / 60 / 60);
  let mins=  Math.floor(counter / 60 % 60);
  let seconds = Math.floor(counter % 60);

  let displayHours = hours < 10? `0${hours}` : hours;
  let displayMins = mins < 10? `0${mins}` : mins;
  let displaySeconds = seconds < 10? `0${seconds}` : seconds;
  return{
  displayHours, 
  displayMins, 
  displaySeconds,
  };
 };
 




  const data = useRef({
    x: 0,
    y: 0,
    z: 0,
  });
  const startTime = new Date().getTime();
  const [subscription, setSubscription] = useState(null);
  const recentAccelerationData = useRef([]);//useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component.
  const steps = useRef([]);//useRef returns a mutable ref object whose .current property is initialized to the passed argument (initialValue). The returned object will persist for the full lifetime of the component.
  const [stepCount, setStepCount] = useState(0);
  const previousHighPointTimeRef = useRef(0);//this is the most recent time we had a spike in acceleration, we initialize it to 0 meaning none
  const previousValue = useRef(0);//we process every 20 measurements, and this will be the 20th measurement from the previous time we processed data, start it at 0
  //Android Docs: The data delay (or sampling rate) controls the interval at which sensor events are sent to your application via the onSensorChanged() callback method. The default data delay is suitable for monitoring typical screen orientation changes and uses a delay of 200,000 microseconds. You can specify other data delays, such as SENSOR_DELAY_GAME (20,000 microsecond delay), SENSOR_DELAY_UI (60,000 microsecond delay), or SENSOR_DELAY_FASTEST (0 microsecond delay).
  // https://developer.android.com/guide/topics/sensors/sensors_overview#java

  //Unable to find the default update interval, however the game play rate in Android is 20 millisecond intervals
  const _slow = () => {
    Accelerometer.setUpdateInterval(1000);
  };

  const _fast = () => {
    Accelerometer.setUpdateInterval(100);
  };

  const _subscribe = () => {
    (async () => {
      await Accelerometer.isAvailableAsync(); //this seems to initialize the Accelerometer for Android
    })(); //check if Acceleromoter is available
    setStepCount(0);
    recentAccelerationData.current=[];
    steps.current=[];
    setSubscription( //we set this state variable so later we can use it to unsubscribe
      Accelerometer.addListener((accelerometerData) => {
        data.current=accelerometerData;
        const { x, y, z } = data.current;
        //console.log("x: "+x+" y:"+y+" z:"+z);
        let total_amount_xyz = Math.sqrt(x * x+ y*y + z*z) * 9.81;
        // console.log(new Date().getTime()+","+total_amount_xyz);
        // console.log("Steps: "+steps.current.length);
        recentAccelerationData.current.push({time: new Date().getTime(), value: total_amount_xyz});
        //  console.log("recentAccelerationData.length", recentAccelerationData.current.length);
        if (recentAccelerationData.current.length>20){
          tallyLatestSteps();
        } 
      })
    );
  };

  const tallyLatestSteps= ()=>{
    // console.log("tallyrecentAccelerationData.length", recentAccelerationData.current.length);
    if (recentAccelerationData.current.length > 0){
    // console.log("RecentAccelerationData: "+JSON.stringify(recentAccelerationData.current));
    const {spikes, previousHighPointTime} = getSpikesFromAccelerometer({recentAccelerationData: recentAccelerationData.current, threshold: 11, previousValue: previousValue.current, previousHighPointTime: previousHighPointTimeRef.current});
    previousValue.current = recentAccelerationData.current[recentAccelerationData.current.length-1].value;//store this for when we need to remember the last value
    previousHighPointTimeRef.current = previousHighPointTime;
    // console.log("Spikes: "+JSON.stringify(spikes)+ " with length: "+spikes.length);
    // console.log("Steps before: "+steps.current.length);
    steps.current=steps.current.concat(spikes);
    // console.log("Steps after: "+steps.current.length);
    recentAccelerationData.current=[];
   if( steps.current.length >= 30) {
    console.log("_unsubscribe");
    setStepCount(0);
    _unsubscribe();
    setCompletionCount(completionCount + 1);
    console.log('completationCount:', completionCount);
   }else{
    setStepCount(steps.current.length);
   }

    }
  }


  const _unsubscribe = () => {
    // tallyLatestSteps();//count the last remaining steps before unsubscribing
    subscription && subscription.remove();
    Accelerometer.removeAllListeners();
    console.log("_")
    setSubscription(null);
  };

  useEffect(() => {
    //_subscribe();
    steps.current=[];
    Accelerometer.setUpdateInterval(100);
    return () => _unsubscribe();
  }, []);

  const { x, y, z } = data.current;
  //console.log("x: "+x+" y:"+y+" z:"+z);
  let total_amount_xyz = Math.sqrt(x * x+ y*y + z*z) * 9.81;
        
//circula process bar
console.log(stepCount, "stepCount");



if (currentScreen === 'counter'){

  return (
     <View style={styles.screen}> 
     <Card style={{backgroundColor:'white', borderRadius: 10, marginTop: 20, marginBottom:20 ,width: 320, shadowColor: "#000",
shadowOffset: {
	width: 0,
	height: 2,
},
shadowOpacity: 0.23,
shadowRadius: 2.62,

elevation: 4}}>
     <CardTitle 
   subtitle={'Steps'}
   title={stepCount}
   />
   <FontAwesome5  name='redo' color='red' size={20} style={{ alignSelf: 'flex-end', marginTop:30, paddingRight:15, position: 'absolute'}} />
   <Image source={exerciseImg}  style={styles.image} ></Image>
<CardContent>
  <Text style={styles.text}>Step Quickly</Text>
  <TouchableOpacity
      onPress={subscription ? _unsubscribe : _subscribe}
      style={styles.button}
    >
      <Text>{subscription ? 'Stop' : 'GO'}</Text>
     </TouchableOpacity>

     </CardContent>
     <ProgressBar progress={(stepCount * 0.50/30) + (completionCount * 0.50)} width={300} height={25} color={'#A0CE4E'} style={styles.bar}/>
</Card>
      </View>
  );

  }
  
else if (currentScreen === 'break'){
  return(
    <View style={styles.screen}> 
    <Card style={{backgroundColor:'#D9F2AD',  borderRadius: 10, marginTop: 20, marginBottom:20 ,width: 320, shadowColor: "#000",
shadowOffset: {
	width: 0,
	height: 2,
},
shadowOpacity: 0.23,
shadowRadius: 2.62,

elevation: 4}}>
    <FontAwesome5  name='redo' color='red' size={20} style={{ alignSelf: 'flex-end', marginTop:30, paddingRight:15, position: 'absolute'}} />
    <CardTitle style={{marginLeft: 10, marginTop:40}}
    subtitle='Take a break for 3 mins'
  />
  <Text style={{fontSize:50, fontWeight:'bold', marginLeft:60, marginBottom:100}}>{clockify().displayHours}:{clockify().displayMins}:{clockify().displaySeconds}</Text>
<CardContent>
 {/* <TouchableOpacity disabled={true} 
     onPress={ ()=>setTimerOn(current => !current,  subscription ? _unsubscribe : _subscribe )}
    //  {subscription ? _unsubscribe : _subscribe}
     style={{marginTop:50,  width: 200, height: 35, borderRadius: 100, backgroundColor: 'gray', alignItems: 'center', marginLeft:50, marginTop:120, padding:7}}>
     <Text>{subscription ? 'Stop' : 'GO'}</Text>
    </TouchableOpacity> */}
    <ProgressBar progress={(stepCount * 0.50/30) + (completionCount * 0.50)} width={300} height={25} color={'#A0CE4E'} style={styles.bar}/>
    </CardContent>
</Card>

     </View>

  );

  } else if(currentScreen > 'result'){
      return(
        <View style={styles.screen}> 
        <Card style={{backgroundColor:'#D9F2AD', borderRadius: 10, marginTop: 20, width: 320 }}>
        <CardTitle 
      title='Outcomes'
       
      />

    <CardContent>
     <Text style={styles.text}>In progress</Text>
    
        </CardContent>
    </Card>
         </View>
      );

      }


}

function round(n) {
  if (!n) {
    return 0;
  }
  return Math.floor(n * 100) / 100;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  button: {
    marginTop: 15,
    marginBottom: 20,
    width: 180,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 100,
    backgroundColor: '#A0CE4E',
    marginLeft:50


  },
  text:{
textAlign: 'center',
marginBottom: 2
  },
  image:{
    width: 122,
    height: 290,
  marginLeft: 100,
  marginBottom: 20
  },
  bar:{
  marginTop:10,
  marginBottom: 25,
  marginLeft: 10
  
  }

});