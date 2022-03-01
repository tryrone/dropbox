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
  Image,
  Platform
} from 'react-native';
import { Dropbox } from 'dropbox';
import FolderSvg from './assets/svgs/folder.svg';
import FileSvg from './assets/svgs/file.svg';
import DownloadSvg from './assets/svgs/download.svg';
import ArrowSvg from './assets/svgs/backArr.svg';
import RNFS from 'react-native-fs';
// @ts-ignore
import { DROPBOX_ACCESS_TOKEN } from '@env';

const { width, height } = Dimensions.get('screen');

export default function App() {
  const dbx = new Dropbox({
    accessToken: DROPBOX_ACCESS_TOKEN,
    fetch,
  });
  const [files,setFiles] = useState<any[]>([]);
  const [folderArray, setFolderArray] = useState<any['']>(['']);

  const sortFiles = (arr:any) => {
   const sortedFiles = arr.sort((a:any,b:any) => {
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
        path: folderArray[folderArray.length - 1],
        limit: 20
      })
      .then((res) => {
        setFiles(res?.result?.entries || []);
        getThumbnails(res?.result?.entries);
      })
      .catch((e) =>{
       Alert.alert('Error Fetching Data', e?.response?.data || 'token expired', [], {
          cancelable: true,
        });
      }
      );
  }, [folderArray]);

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
  }

  const downLoadFile =  (fileObj:any) => {
      dbx.filesDownload({
        path: fileObj?.path_lower
      }).then(async(res) => {
        const downloadedFile = JSON.stringify(res);
        const downloadedFileObj = JSON.parse(downloadedFile).result;

              RNFS.writeFile(
                `${RNFS.DownloadDirectoryPath}`,
                downloadedFileObj?.fileBlob,
                'ascii'
              )
                .then((res) => console.log(res))
                .catch((err) => console.log(err));
      }).catch(e => console.log(e))
  }

  return (
    <SafeAreaView>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            folderArray.length > 1 &&
              setFolderArray(folderArray.slice(0, folderArray.length - 1));
          }}
          style={styles.backarrow}
        >
          <ArrowSvg />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {sortFiles(files).map((file: any) => {
            return (
              <TouchableOpacity
                onPress={() =>
                  file['.tag'] === 'folder' &&
                  setFolderArray([...folderArray, `/${file?.name}`])
                }
                key={file?.id}
              >
                <View style={styles.fileWrapper}>
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
                    <TouchableOpacity
                      onPress={() =>
                        file['.tag'] === 'file' && downLoadFile(file)
                      }
                      style={styles.gestureHandler}
                    >
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
  scrollView:{
    marginBottom: Platform.OS === 'android' ? height * 0.15 : height * 0.1
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
    width: width * 0.7
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
  },
  backarrow:{
    height: 24,
    width: 24,
    marginBottom:10,
    marginTop:10,
  },
});
