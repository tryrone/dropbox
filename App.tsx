import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import { Dropbox } from 'dropbox';
import FolderSvg from './assets/svgs/folder.svg';
import FileSvg from './assets/svgs/file.svg';
import DownloadSvg from './assets/svgs/download.svg';

const { width, height } = Dimensions.get('screen');

export default function App() {
  const dbx = new Dropbox({
    accessToken:
      'zo6y71lNJ4gAAAAAAAAAAQWFUyl3xv1FKel7QMD__l8xV9RXL8Gqe1UURvfyPhk-',
    fetch,
  });
  const [files,setFiles] = useState<any[]>([]);

  const sortFiles = (arr:any) => {
   const sortedFiles = arr.sort((a,b) => {
      if((a['.tag'] === 'folder' || b['.tag'] === 'folder') && !(a['.tag'] === b['.tag'])){
        return a['.tag'] === 'folder' ? -1 : 1;
      }else{
        return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
      }
    });
    return sortedFiles;
  }


  useEffect(() => {
    dbx
      .filesListFolder({
        path: '',
        limit: 20
      })
      .then((res) => {
        setFiles(res?.result?.entries || []);
        getThumbnails(res?.result?.entries);
      })
      .catch((e) =>
        Alert.alert('Error Fetching Data', e?.response?.data || 'token expired', [], {
          cancelable: true,
        })
      );
  }, []);

  const getThumbnails = (filesArray:any) => {
    const paths:any = filesArray.filter((file:any) => file['.tag'] === 'file')
    .map((file:any) => ({
      path:file?.path_lower,
      size:'w32h32'
    }))

    dbx
      .filesGetThumbnailBatch({
        entries: paths,
      })
      .then((res) =>{
         const newStateFiles = [...filesArray];

         res.result.entries.forEach((file:any) => {
          let indexToUpdate = filesArray.findIndex(
            (stateFile:any) => file?.metadata?.path_lower === stateFile?.path_lower
          )

          newStateFiles[indexToUpdate].thumbnail = file?.thumbnail
         });

         setFiles(newStateFiles)
        })
      .catch((e) =>
        Alert.alert(
          'Error Fetching Data',
          e?.error || 'token expired',
          [],
          {
            cancelable: true,
          }
        )
      );
  }

  const downLoadFile =  (fileObj:any) => {
      dbx.filesDownload({
        path: fileObj?.path_lower
      }).then(async(res) => {
        const downloadedFile = JSON.stringify(res);
        const downloadedFileObj = JSON.parse(downloadedFile).result;
        const url = URL.createObjectURL(downloadedFileObj?.fileBlob);

        const imageUri = `data:application/${downloadedFileObj?.fileBlob?._data?.type};base64,` + url;

        console.log(imageUri);

      }).catch(e => console.log(e))
  }



  return (
    <SafeAreaView>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <ScrollView>
          {sortFiles(files).map((file:any) => {
            return (
              <TouchableOpacity key={file?.id} >
                <View  style={styles.fileWrapper}>
                  <View style={styles.row}>
                    {file?.thumbnail ? (
                      <Image
                        source={{
                          uri: `data:image/jpeg;base64, ${file?.thumbnail}`,
                        }}
                        style={styles.thumbnailImage}
                        resizeMode="contain"
                      />
                    ) : file['.tag'] === 'file' ? (
                      <FileSvg />
                    ) : (
                      <FolderSvg />
                    )}

                    <Text
                      style={styles.fileName}
                      numberOfLines={2}
                      ellipsizeMode="middle"
                    >
                      {file?.name}
                    </Text>
                  </View>
                  {file['.tag'] === 'file' && (
                    <TouchableOpacity onPress={() => file['.tag'] === 'file' && downLoadFile(file)} style={styles.gestureHandler}>
                      <DownloadSvg />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height,
    width,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  fileWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomColor: '#CFD2D8',
    borderBottomWidth: 0.3,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 10,
  },
  gestureHandler:{
    padding: 5,
    borderRadius: 35 * 0.5,
    justifyContent:"center",
    alignItems:'center'
  },
  thumbnailImage:{
    height: 24,
    width: 24
  }
});
