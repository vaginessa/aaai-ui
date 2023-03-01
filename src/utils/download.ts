import type { ImageData } from '@/stores/outputs'
import { ElMessage } from 'element-plus';
import JSZip from 'jszip';
import Image from 'image-js';
import { useOptionsStore } from '@/stores/options';

export async function downloadMultipleWebp(outputs: ImageData[]) {
    const zip = new JSZip();

    ElMessage({
        message: `Downloading ${outputs.length} image(s)...`,
        type: 'info',
    })

    for (let i = 0; i < outputs.length; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {image, id, ...jsonData} = outputs[i];
        // Make a valid file name, and only get first 128 characters so we don't break the max file name limit
        const fileName = `${i}-${outputs[i].seed}-${outputs[i].prompt}`.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd();
        // Create webp file
        zip.file(
            fileName + ".webp",
            image.split(",")[1], // Get base64 from data url
            { base64: true }
        );
        // Create JSON file
        zip.file(
            fileName + ".json",
            JSON.stringify(jsonData, undefined, 4) // Stringify JSON with pretty printing
        );
    }

    const zipFile = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE"
    });
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(zipFile);
    downloadLink.download = "stable_horde.zip";
    downloadLink.click();
}

export async function downloadImage(base64Data: string, fileName: string) {    
    const store = useOptionsStore();
    Image.load(base64Data).then(function (image) {

        let newFileName = fileName.replace(/[/\\:*?"<>]/g, "").substring(0, 128).trimEnd(); // Only get first 128 characters so we don't break the max file name limit

        const downloadLink = document.createElement("a");

        if (store.pictureDownloadType == "PNG") 
        {
            newFileName += ".png";
            downloadLink.href = image.toDataURL("image/png");
        }/* Only Image Depth of 1 is supported... is it worth it?
        else if (store.pictureDownloadType == "BMP")
        {
            newFileName += ".bmp";
            downloadLink.href = image.toDataURL("image/bmp");
        }*/
        else if (store.pictureDownloadType == "JPG")
        {
            newFileName += ".jpg";
            downloadLink.href = image.toDataURL("image/jpg");
        }
        else if (store.pictureDownloadType == "WEBP")
        {
            newFileName += ".webp";
            downloadLink.href = image.toDataURL("image/webp");
        }
        
        downloadLink.download = newFileName; 
        downloadLink.click();
    });

}