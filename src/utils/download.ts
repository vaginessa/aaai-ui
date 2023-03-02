import type { ImageData } from '@/stores/outputs'
import { ElMessage } from 'element-plus';
import JSZip from 'jszip';
import Image from 'image-js';
import { useOptionsStore } from '@/stores/options';

export async function downloadMultipleWebp(outputs: ImageData[]) {
    const optionStore = useOptionsStore();
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

        // Create image file
        await Image.load(image).then(function (image) {
            if (optionStore.pictureDownloadType == "PNG") 
            {
                zip.file(
                    fileName + ".png",
                    image.toBlob("image/png", 85)
                );
            }
            else if (optionStore.pictureDownloadType == "JPG")
            {
                zip.file(
                    fileName + ".jpeg",
                    image.toBlob("image/jpeg", 85)
                );
            }
            else if (optionStore.pictureDownloadType == "WEBP")
            {
                zip.file(
                    fileName + ".webp",
                    image.toBase64("image/webp"),
                    { base64: true }
                );
            }
        });
        
        if (optionStore.zipMetaData == "Enabled") {
            // Create JSON file
            zip.file(
                fileName + ".json",
                JSON.stringify(jsonData, undefined, 4) // Stringify JSON with pretty printing
            );
        }
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

        if (store.pictureDownloadType == "PNG") 
        {
            const downloadLink = document.createElement("a");
            newFileName += ".png";
            downloadLink.href = image.toDataURL("image/png");
            downloadLink.download = newFileName; 
            downloadLink.click();
        }
        else if (store.pictureDownloadType == "JPG")
        {
            newFileName += ".jpeg";
            
            Promise.resolve(image.toBlob("image/jpeg", 85)).then(data => {
                const objectUrl: string = URL.createObjectURL(data);
                const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;
            
                a.href = objectUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();        
            
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
            });

        }
        else if (store.pictureDownloadType == "WEBP")
        {
            const downloadLink = document.createElement("a");
            newFileName += ".webp";
            downloadLink.href = image.toDataURL("image/webp");
            downloadLink.download = newFileName; 
            downloadLink.click();
        }
    });

}