
export const getUserMedia = async(options: MediaStreamConstraints) => {
   const stream = await navigator.mediaDevices.getUserMedia(options);
   return stream;
}