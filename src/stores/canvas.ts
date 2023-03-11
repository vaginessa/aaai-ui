import { defineStore } from "pinia";
import { ref } from "vue";
import { useGeneratorStore } from "./generator";
import { fabric } from "fabric";
import { Image, encode } from "image-js";
import { loadURL as base64Image, toBase64URL } from "../utils/base64"
import { InterpolationType } from "image-js/lib/utils/interpolatePixel";

export const useCanvasStore = defineStore("canvas", () => {

    const gSotre = useGeneratorStore();
    const imageStage = ref<"Scaling" | "Painting" | "PaintingMask">("Scaling");

    const canvas = ref<fabric.Canvas>();
    const originalBase64 = ref<string>();
    const originalImage = ref<Image>();
    const workingBase64 = ref<string>();
    const workingImage = ref<Image>();
    const canvasImage = ref<fabric.Object>();
    const fixedImage = ref<fabric.Object>();
    const maskObject = ref<fabric.Object>();
    const maskLayer = ref<fabric.Canvas>();
    const paintLayer = ref<fabric.Canvas>();
    const canvasBorder = ref<fabric.Rect>();
    const maskRect = ref<fabric.Rect>();

    const erasing = ref(false);
    const isDrawing = ref(false);
    const undoHistory = ref<IHistory[]>();
    const redoHistory = ref<IHistory[]>();

    const width = ref(512);
    const height = ref(512);
    const canvasImageScaleFactor = ref(1);
    
    const brush =  ref<fabric.BaseBrush>();
    const brushSize = ref(30);
    const drawColor = ref("rgb(0, 0, 0, 1)");
    const outlineLayer  = new fabric.Circle({
        radius: brushSize.value,
        left: 0,
        originX: "center",
        originY: "center",
        angle: 0,
        fill: "",
        stroke: "red",
        strokeWidth: 3,
        opacity: 0,
        evented: false,
    });

    const readyToSubmit = ref(false);
    const whitePixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUGFdj+P///38ACfsD/QVDRcoAAAAASUVORK5CYII=';

    interface IHistory {
        path: fabric.Path;
        drawPath?: fabric.Path;
        visibleDrawPath?: fabric.Path;
    }

    interface pathCreateOptions {
        history?: IHistory;
        erase?: boolean;
        draw?: boolean;
    }

    function createNewCanvas(canvasElement: string) {
        fabric.Object.prototype.transparentCorners = false;
        canvas.value = new fabric.Canvas(canvasElement, {
            backgroundColor: "rgba(12,12,12,0.8)",
            width: width.value,
            height: height.value,
            preserveObjectStacking: true
        });
        canvas.value.selection = false;
        canvas.value.freeDrawingCursor = "crosshair";
        
        maskLayer.value = new fabric.Canvas(null);
        maskLayer.value.selection = false;
        maskLayer.value.backgroundColor = "black";
        maskLayer.value.setHeight(height.value);
        maskLayer.value.setWidth(width.value);
        
        paintLayer.value = new fabric.Canvas(null);
        paintLayer.value.selection = false;
        paintLayer.value.backgroundColor = "white";
        paintLayer.value.setHeight(height.value);
        paintLayer.value.setWidth(width.value);

        maskObject.value = new fabric.Image("");
        maskObject.value.width = width.value;
        maskObject.value.height = height.value;

        canvas.value.on("mouse:wheel", onMouseWheel);
        canvas.value.on("mouse:move", onMouseMove);
        canvas.value.on("path:created", onPathCreated);
    }

    function blankImage() {
        var center = canvas.value?.getCenter();
        // Create a 1x1 white pixel and resize
        fabric.Image.fromURL(whitePixel, image => {
            if (!canvas.value) return;

            image.scaleToWidth((gSotre.params.width || 512 ));
            image.scaleToHeight((gSotre.params.height || 512 ));
            workingBase64.value = image.toDataURL({ format: "webp" });
            gSotre.currentImageProps.sourceImage = workingBase64.value;
            isDrawing.value = true;
            canvas.value.setBackgroundImage(workingBase64.value, canvas.value?.renderAll.bind(canvas.value),{
                originX: 'center',
                originY: 'center',
                top: center?.top || 0,
                left: center?.left || 0,
            });
            canvas.value.add(outlineLayer);
            canvas.value.isDrawingMode = true;
            imageStage.value = "Painting";
        });
    }

    function RefreshRect() {
        if(canvasBorder.value !== undefined) {
            canvas.value?.remove(canvasBorder.value);
            addBorder();
        }
    }

    function addBorder() { 
        let rectMaxRatioX = gSotre.maxHeight / (canvas.value?.width || 512); 
        let rectMaxRatioY = gSotre.maxHeight / (canvas.value?.width || 512); 
        let rectX = Math.round((gSotre.params.width || 1) / rectMaxRatioX);
        let rectY = Math.round((gSotre.params.height || 1) / rectMaxRatioY);
        let rectLeft = Math.round((width.value - rectX) / 2);
        let rectTop = Math.round((height.value - rectY) / 2);
        canvasBorder.value = new fabric.Rect({
            width: rectX - 2,
            height: rectY - 2,
            top: rectTop + 1,
            left: rectLeft + 1,
            originX: "left",
            originY: "top",
            fill: "transparent",
            hasControls: false,
            stroke: 'red',
            strokeWidth: 1,
            lockMovementX: true,
            lockMovementY: true,
            selectable: false,
            evented: false,
        });
        canvas.value?.add(canvasBorder.value);
    }

    function addImageObjectToCanvas(base64Images: string) {
        originalBase64.value = base64Images;
        base64Image(base64Images).then((img) => {
            originalImage.value = img;
        })
        fabric.Image.fromURL(base64Images, (oImg) => {
            let canvasImageScaleFactor = 1;
            let scaleFactorNeededX = 1;
            let scaleFactorNeededY = 1;
            if((oImg.width || 0) > width.value) scaleFactorNeededX = width.value / (oImg.width || 0);
            if((oImg.height || 0) > height.value) scaleFactorNeededY = height.value / (oImg.height || 0);
            if(scaleFactorNeededX < scaleFactorNeededY && scaleFactorNeededX < canvasImageScaleFactor) {
                canvasImageScaleFactor = scaleFactorNeededX;
            } else {
                canvasImageScaleFactor = scaleFactorNeededY;
            }
            canvasImage.value = oImg.set({ 
                left: (width.value / 2) - (((oImg.width || 0) / 2) * canvasImageScaleFactor), 
                top: (height.value / 2) - (((oImg.height || 0) / 2) * canvasImageScaleFactor),
                hasControls: false,
                hasBorders: false,
            }).scale(canvasImageScaleFactor);
            canvas.value?.add(canvasImage.value);
            addBorder();
        });
    }

    function RemoveImage() {
        if(canvas.value === undefined) return;

        canvas.value.clear();

        if(canvasImage.value !== undefined)
            canvas.value.remove(canvasImage.value);
        if(canvasBorder.value !== undefined)
            canvas.value.remove(canvasBorder.value);
        if(outlineLayer !== undefined)
            canvas.value.remove(outlineLayer);
        if(fixedImage.value !== undefined)
            canvas.value?.remove(fixedImage.value);

        gSotre.currentImageProps.sourceImage = undefined;

        canvas.value?.setBackgroundImage(0, canvas.value?.renderAll.bind(canvas.value));
        canvas.value?.setBackgroundColor("rgba(12,12,12,0.8)", canvas.value?.renderAll.bind(canvas.value));

        canvas.value.isDrawingMode = false;
        isDrawing.value = false;
        
        maskLayer.value = new fabric.Canvas(null);
        maskLayer.value.selection = false;
        maskLayer.value.backgroundColor = "black";
        maskLayer.value.setHeight(height.value);
        maskLayer.value.setWidth(width.value);
        
        paintLayer.value = new fabric.Canvas(null);
        paintLayer.value.selection = false;
        paintLayer.value.backgroundColor = "white";
        paintLayer.value.setHeight(height.value);
        paintLayer.value.setWidth(width.value);

        maskObject.value = new fabric.Image("");
        maskObject.value.width = width.value;
        maskObject.value.height = height.value;
    }

    function AcceptImage() {
        if(canvas.value === undefined) return;
        var center = canvas.value.getCenter();
        prepareImage().then(() => {
            if(canvas.value !== undefined && canvasImage.value !== undefined && workingImage.value !== undefined && canvasBorder.value !== undefined && workingBase64.value !== undefined) {
                imageStage.value = "PaintingMask";
                canvas.value?.remove(canvasImage.value, canvasBorder.value);
                
                fabric.Image.fromURL(workingBase64.value, (oImg) => {
                    if(canvas.value === undefined) return;
                    
                    let canvasImageScaleFactor = 1;
                    let scaleFactorNeededX = 1;
                    let scaleFactorNeededY = 1;
                    if((oImg.width || 0) > width.value) scaleFactorNeededX = width.value / (oImg.width || 0);
                    if((oImg.height || 0) > height.value) scaleFactorNeededY = height.value / (oImg.height || 0);
                    if(scaleFactorNeededX < scaleFactorNeededY && scaleFactorNeededX < canvasImageScaleFactor) {
                        canvasImageScaleFactor = scaleFactorNeededX;
                    } else {
                        canvasImageScaleFactor = scaleFactorNeededY;
                    }

                    fixedImage.value = oImg.set({ 
                        left: (width.value / 2) - (((oImg.width || 0) / 2) * canvasImageScaleFactor), 
                        top: (height.value / 2) - (((oImg.height || 0) / 2) * canvasImageScaleFactor),
                        hasControls: false,
                        hasBorders: false,
                    }).scale(canvasImageScaleFactor);

                    canvas.value.add(fixedImage.value);

                    if(maskObject.value !== undefined)
                        canvas.value.add(maskObject.value);

                    canvas.value.add(outlineLayer);
                    canvas.value.isDrawingMode = true;
                });
            }
        });
    }

    function saveImages() {
        if (maskLayer.value === undefined) return;

        readyToSubmit.value = false;

        const dataUrlOptions = {
            format: "webp",
            left: 0,
            top: 0,
            width: 512,
            height: 512,
        };

        fabric.Image.fromURL(maskLayer.value.toDataURL(dataUrlOptions), (oImg) => {

            oImg.scaleX = (gSotre.params.width || 512) / (oImg.width || 512);
            oImg.scaleY = (gSotre.params.height || 512) / (oImg.height || 512);

            gSotre.currentImageProps.sourceImage = workingBase64.value;
            gSotre.currentImageProps.maskImage = redoHistory.value?.length === 0 ? undefined : oImg.toDataURL({});
            if(gSotre.checkIfNotControlNet) {
                if(gSotre.checkIfInpainting) {
                    gSotre.currentImageProps.sourceProcessing = "inpainting";
                } else gSotre.currentImageProps.sourceProcessing = "img2img";
            } else gSotre.currentImageProps.sourceProcessing = "img2img";
            readyToSubmit.value = true;

        });
    }

    function UpdateOverlay() {
        if (maskLayer.value === undefined) return;
        const dataUrlOptions = {
            format: "webp",
        };
        fabric.Image.fromURL(maskLayer.value.toDataURL(dataUrlOptions), (oImg) => {
            if (maskObject.value === undefined) return;
            canvas.value?.remove(maskObject.value);
            maskObject.value = oImg.set({
                backgroundColor: "transparent",
                opacity: 0.4,
                originX: "center",
                originY: "center",
                left: 256,
                top: 256
            });
            canvas.value?.add(maskObject.value);
            canvas.value?.renderAll();
        });
    }

    function flipErase() {
        erasing.value = !erasing.value;
    }

    function BackToScaling() {
        if (originalBase64.value !== undefined) {
            imageStage.value = "Scaling";
            fabric.Image.fromURL(originalBase64.value, (oImg) => {

                canvas.value?.remove(outlineLayer);
                canvas.value?.setBackgroundImage(0, canvas.value?.renderAll.bind(canvas.value));
                canvas.value?.setBackgroundColor("rgba(12,12,12,0.8)", canvas.value?.renderAll.bind(canvas.value));
                
                if (maskObject.value !== undefined)
                    canvas.value?.remove(maskObject.value);
                if(canvasImage.value !== undefined)
                    canvas.value?.remove(canvasImage.value);
                if(fixedImage.value !== undefined)
                    canvas.value?.remove(fixedImage.value);
                
                maskLayer.value = new fabric.Canvas(null);
                maskLayer.value.selection = false;
                maskLayer.value.backgroundColor = "black";
                maskLayer.value.setHeight(height.value);
                maskLayer.value.setWidth(width.value);
                
                paintLayer.value = new fabric.Canvas(null);
                paintLayer.value.selection = false;
                paintLayer.value.backgroundColor = "white";
                paintLayer.value.setHeight(height.value);
                paintLayer.value.setWidth(width.value);

                maskObject.value = new fabric.Image("");
                maskObject.value.width = width.value;
                maskObject.value.height = height.value;

                if (canvas.value !== undefined)
                    canvas.value.isDrawingMode = false;
                isDrawing.value = false;

                canvasImageScaleFactor.value = 1;
                let scaleFactorNeededX = 1;
                let scaleFactorNeededY = 1;
                if((oImg.width || 0) > width.value) scaleFactorNeededX = width.value / (oImg.width || 0);
                if((oImg.height || 0) > height.value) scaleFactorNeededY = height.value / (oImg.height || 0);
                if(scaleFactorNeededX < scaleFactorNeededY && scaleFactorNeededX < canvasImageScaleFactor.value) {
                    canvasImageScaleFactor.value = scaleFactorNeededX;
                } else {
                    canvasImageScaleFactor.value = scaleFactorNeededY;
                }
                canvasImage.value = oImg.set({ 
                    left: (width.value / 2) - (((oImg.width || 0) / 2) * canvasImageScaleFactor.value), 
                    top: (height.value / 2) - (((oImg.height || 0) / 2) * canvasImageScaleFactor.value),
                    hasControls: false,
                    hasBorders: false,

                }).scale(canvasImageScaleFactor.value);
                canvas.value?.add(canvasImage.value);
                addBorder();
                readyToSubmit.value = false;
            });
        }
    }

    async function prepareImage() {  
        let rectMaxRatioX = gSotre.maxHeight / (canvas.value?.width || 512); 
        let rectMaxRatioY = gSotre.maxHeight / (canvas.value?.width || 512); 
        let factorX = (canvasImage.value?.width || 1) / (canvasImage.value?.getScaledWidth() || 1);
        let factorY = (canvasImage.value?.height || 1) / (canvasImage.value?.getScaledHeight() || 1);    
        let rectX = Math.round(((gSotre.params.width || 1) * factorX) / rectMaxRatioX);
        let rectY = Math.round(((gSotre.params.height || 1) * factorY) / rectMaxRatioY);
        let rectLeft = Math.round((width.value * factorX - rectX) / 2);
        let rectTop = Math.round((height.value * factorY - rectY) / 2);
        let totalLeft = Math.round((rectLeft) - ((canvasImage.value?.left || 1) * factorX));
        let totalTop = Math.round((rectTop) - ((canvasImage.value?.top || 1) * factorY));

        let whiteSpaceX:number = 0;
        let whiteSpaceY:number = 0;
        let whiteSpaceLeft:number = 0;
        let whiteSpaceTop:number = 0;

        if(originalImage.value !== undefined) {
            if(totalLeft < 0) {
                rectX += totalLeft;
                whiteSpaceX = Math.round(Math.abs(totalLeft));
                totalLeft = 0;     
            }
            if(totalTop < 0) {
                rectY += totalTop;
                whiteSpaceY = Math.round(Math.abs(totalTop));
                totalTop = 0; 
            }
            if((totalLeft + rectX) > originalImage.value?.width) {
                let overhangX = (totalLeft + rectX) - originalImage.value?.width;
                rectX -= overhangX;
                whiteSpaceLeft += overhangX;
            }
            if((totalTop + rectY) > originalImage.value?.height) {
                let overhangY = (totalTop + rectY) - originalImage.value?.height;
                rectY -= overhangY;
                whiteSpaceTop += overhangY;
            }
            let coppedImage:Image = await originalImage.value.crop({
                origin: {column: totalLeft, row: totalTop}, 
                width: rectX, 
                height: rectY
            });

            maskRect.value = new fabric.Rect({
                left: totalLeft,
                top: totalTop,
                width: rectX, 
                height: rectY
            });

            let finalImage:Image = new Image(rectX+whiteSpaceX+whiteSpaceLeft, rectY+whiteSpaceY+whiteSpaceTop, {colorModel: coppedImage.colorModel});
            let finalImage2 = await coppedImage.copyTo(finalImage, {
                origin: {column: whiteSpaceX, row: whiteSpaceY}
            });
            workingImage.value = finalImage2.resize({
                width: (gSotre.params.width || 1), 
                height: (gSotre.params.height || 1), 
                interpolationType: InterpolationType.BILINEAR
            });
            let b64s = await toBase64URL(encode(workingImage.value), "image/webp");
            workingBase64.value = b64s;
        }
    }

    function onMouseMove(event: fabric.IEvent<Event>) {
        if (!canvas.value) return;

        const pointer = canvas.value.getPointer(event.e);
        outlineLayer.left = pointer.x;
        outlineLayer.top = pointer.y;
        outlineLayer.opacity = 0.8;

        if (erasing.value) {
            outlineLayer.set("strokeWidth", 3);
            outlineLayer.set("fill", "");
            setBrush("red");
        } else {
            outlineLayer.set("strokeWidth", 0);
            if (!erasing.value) {
                outlineLayer.set("fill", drawColor.value);
                setBrush(drawColor.value);
            } else {
                outlineLayer.set("fill", "white");
                setBrush("white");
            }
        }
        outlineLayer.set("radius", brushSize.value / 2);
        canvas.value.renderAll();
    }
    
    function setBrush(color: string | null = null) {
        if (!canvas.value) return;
        brush.value = canvas.value.freeDrawingBrush;
        brush.value.color = color || brush.value.color;
        brush.value.width = brushSize.value;
    }

    function onMouseWheel(event: fabric.IEvent<WheelEvent>) {
        if (!canvas.value) return;
        if (imageStage.value !== "Scaling") return;

        if(event.e.deltaY > 0) {
            canvasImageScaleFactor.value = (canvasImageScaleFactor.value || 1) - 0.1;
        } else {
            canvasImageScaleFactor.value = (canvasImageScaleFactor.value || 1) + 0.1;
        }
        if(canvasImageScaleFactor.value < 0.1) {
            canvasImageScaleFactor.value = 0.1;
        }
        canvasImage.value?.set({ 
            left: (width.value / 2) - (((canvasImage.value.width || 0) / 2) * (canvasImageScaleFactor.value || 1)), 
            top: (height.value / 2) - (((canvasImage.value.height || 0) / 2) * (canvasImageScaleFactor.value || 1)),
        }).scale(canvasImageScaleFactor.value || 1);
        canvas.value.requestRenderAll();
    }

    function resetCanvas() {
        RemoveImage();
        canvasImageScaleFactor.value = 1;
        imageStage.value = "Scaling";
        readyToSubmit.value = false;
        redoHistory.value = undefined;
        undoHistory.value = undefined;
    }

    async function onPathCreated(e: any) {
        const path: IHistory = { path: e.path }
        pathCreate({history: path, erase: erasing.value, draw: isDrawing.value});
        redoHistory.value?.push(path);
    }
    
    async function pathCreate({history, erase = false, draw = false}: pathCreateOptions = {}) {
        if (!history) return; 
        if (!maskLayer.value) return;
        if (!paintLayer.value) return;
        if (!canvas.value) return;

        history.path.selectable = false;
        history.path.opacity = 1;

        history.drawPath  = await asyncClone(history.path) as fabric.Path;
        history.visibleDrawPath = await asyncClone(history.path) as fabric.Path;

        if (erase) {
            history.visibleDrawPath.globalCompositeOperation = 'destination-out';
            history.drawPath.stroke = "black";
        } else {
            history.visibleDrawPath.globalCompositeOperation = 'source-over';
            history.drawPath.stroke = draw ? drawColor.value : "white";
        }
        if (draw)
            paintLayer.value.add(history.drawPath);
        else {
            maskLayer.value.add(history.drawPath);
            UpdateOverlay();
        }

        canvas.value.remove(history.path);
        canvas.value.renderAll();
    }

    function downloadMask() {
        saveImages();
        const anchor = document.createElement("a");
        if (isDrawing.value) {
            anchor.href = 'data:image/webp;base64,'+gSotre.currentImageProps.sourceImage?.split(",")[1];
            anchor.download = "image_drawing.webp";
            anchor.click();
            return;
        }
        anchor.href = 'data:image/webp;base64,'+gSotre.currentImageProps.maskImage?.split(",")[1];
        anchor.download = "image_mask.webp";
        anchor.click();
    }

    async function asyncClone(object: any) {
        return new Promise((resolve, reject) => {
            try {
                object.clone(resolve);
            } catch (error) {
                reject(error);
            }
        });
    }

    function redoAction() {
        if (undoHistory.value === undefined || undoHistory.value.length === 0) return;
        const path = undoHistory.value.pop() as IHistory;
        pathCreate({history: path, erase: false, draw: isDrawing.value});
        redoHistory.value?.push(path);
    }

    function undoAction() {
        if (redoHistory.value === undefined || redoHistory.value.length === 0) return;
        if (!paintLayer.value) return;
        if (!maskLayer.value) return;
        if (!canvas.value) return;
        const path = redoHistory.value.pop() as IHistory;
        undoHistory.value?.push(path);
        if (isDrawing.value) {
            paintLayer.value?.remove(path.drawPath as fabric.Path); 
        } else {
            maskLayer.value?.remove(path.drawPath as fabric.Path); 
            UpdateOverlay();
        }
        delete path.drawPath; 
        delete path.visibleDrawPath;
        canvas.value.renderAll();
    }

    return {
        imageStage,
        erasing,
        drawColor,
        isDrawing,
        brushSize,
        readyToSubmit,
        redoHistory,
        undoHistory,

        flipErase,
        RefreshRect,
        createNewCanvas,
        addImageObjectToCanvas,
        resetCanvas,
        AcceptImage,
        RemoveImage,
        BackToScaling,
        setBrush,
        blankImage,
        saveImages,
        downloadMask,
    };

});
