
export const getUserMedia = async(options: MediaStreamConstraints) => {
   const stream = await navigator.mediaDevices.getUserMedia(options);
   return stream;
}

export const getDisplayMedia = async(options: DisplayMediaStreamOptions) => {
   try{
      const displayStream = await navigator.mediaDevices.getDisplayMedia(options);
      return displayStream;
   }catch(error){
      return null;
   }
}

export const getRandomColor = () => {
   const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16);
   return `#${hex.padStart(6, '0')}`;
}