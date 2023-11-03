import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, FlatList, Dimensions, StyleSheet } from "react-native";
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { addDoc, collection, onSnapshot } from "firebase/firestore";
import { db, storage } from "../firebaseConfig";
import { Video } from "expo-av";
import { Alert } from 'react-native';
const { width, height } = Dimensions.get('window');

function Tourist({ navigation }) {
  const [video, setVideo] = useState("");
  const [progress, setProgress] = useState(0);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "files"), (snapshot) => {
      const newFiles = snapshot.docs.map(doc => ({
        id: doc.id,
        liked: false,
        reported: false,
        bookmarked: false,
        ...doc.data()
      })).filter(file => file.fileType === "video");
      setFiles(newFiles);
    });

    return () => unsubscribe();
  }, []);

  async function pickVideo() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (result && !result.canceled) {
      const videoInfo = await Video.getAssetInfoAsync(result.uri);
    
    // Check if the duration is less than or equal to 30 seconds (30000 milliseconds)
    if (videoInfo.duration <= 30000) {
      setVideo(result.uri);
      await uploadVideo(result.uri);
    } else {
      // Alert the user if the video is too long
      alert("Please select a video that is less than 30 seconds.");
    }
    }
  }

  async function recordVideo() {
    Alert.alert(
      "Select Video",
      "Would you like to record a new video or choose from the gallery?",
      [
        {
          text: "Record",
          onPress: () => captureVideo(),
        },
        {
          text: "Pick from Gallery",
          onPress: () => pickVideo(),
        },
        {
          text: "Cancel",
          style: "cancel"
        },
      ]
    );
  }

  async function reportVideo() {
    Alert.alert(
      "Select Report Reason",
      "",
      [
        {
          text: "Nudity/Pornography",
          style: "cancel",
        },
        {
          text: "Inappropriate Content",
          style: "cancel",
        },
        {
          text: "Broken/Not Working",
          style: "cancel",
        },
        {
          text: "Hate Topics/Violence",
          style: "cancel",
        },
        {
          text: "Cancel",
          style: "cancel"
        },
      ]
    );
}

  async function captureVideo() {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }
  
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true, 
      quality: 1,
      videoMaxDuration: 30,
    });
  
    if (result && !result.canceled) {
      setVideo(result.assets[0].uri);
      await uploadVideo(result.assets[0].uri);
    }
  }
  

  async function uploadVideo(uri) {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `Videos/${new Date().getTime()}`);

    const uploadTask = uploadBytesResumable(storageRef, blob);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(progress));
      },
      (error) => {
        console.error("Upload error: ", error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
          await saveRecord("video", downloadURL, new Date().toISOString());
          setVideo("");
        });
      }
    );
  }

  async function saveRecord(fileType, url, createdAt) {
    try {
      await addDoc(collection(db, "files"), {
        fileType,
        url,
        createdAt,
      });
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  // Toggle like status
  const handleLike = (id) => {
    setFiles(files.map(file => file.id === id ? { ...file, liked: !file.liked } : file));
  };

  // Toggle report status
  const handleReport = (id) => {
    setFiles(files.map(file => file.id === id ? { ...file, reported: !file.reported } : file));
  };

  // Toggle bookmark status
  const handleBookmark = (id) => {
    setFiles(files.map(file => file.id === id ? { ...file, bookmarked: !file.bookmarked } : file));
  };

  const handleComment = () => { console.log("Comment Pressed"); };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.videoContainer}>
            <Video
              source={{ uri: item.url }}
              rate={1.0}
              volume={1.0}
              isMuted={true}
              resizeMode="cover"
              shouldPlay
              isLooping
              useNativeControls={false}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={styles.iconContainer}>
              <Ionicons style={styles.iconindividual}
                name={item.liked ? "heart" : "heart-outline"}
                size={30}
                color={item.liked ? "red" : "black"}
                onPress={() => handleLike(item.id)}
              />
              <Ionicons style={styles.iconindividual}
                name="chatbubble-outline"
                size={30}
                color="black"
                onPress={handleComment}
              />
              <Ionicons style={styles.iconindividual}
                name={item.reported ? "alert-circle" : "alert-circle-outline"}
                size={30}
                color={item.reported ? "black" : "black"}
                onPress={reportVideo}
              />
              <Ionicons style={styles.iconindividual}
                name={item.bookmarked ? "bookmark" : "bookmark-outline"}
                size={30}
                color={item.bookmarked ? "black" : "black"}
                onPress={() => handleBookmark(item.id)}
              />
            </View>
          </View>
        )}
      />
      <TouchableOpacity
        onPress={recordVideo}
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          width: 60,
          height: 60,
          backgroundColor: "black",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 30,
        }}
      >
        <Ionicons name="videocam" size={30} color="white" />
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    padding: 10,
  },
  videoContainer: {
    width: width,
    height: height
  },
  iconindividual: {
    paddingTop:30,
  },

});

export default Tourist;
