import { analyzeFrame } from "./analyzeFrame";

const FRAME_INTERVAL_SEC = 0.05;

//seek video to a specified time and wait for frame
function seekVideoToTime(video, timeSec) {
    return new Promise((resolve) => {
        //already at this line, wont seek again
        if (Math.abs(video.currentTime - timeSec) < 0.001) {
            resolve();
            return;
        }

        const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            resolve();
        }

        video.addEventListener("seeked", onSeeked);
        video.currentTime = timeSec;
    });
}