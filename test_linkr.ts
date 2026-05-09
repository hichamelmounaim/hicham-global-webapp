import { linkrImagine, linkrFetchTask, linkrWaitForResult, validateLinkrApiKey } from './lib/linkrapi'

const API_KEY = 'lkr_4bf7e9097dfb4492b3553db349639c71'

async function run() {
    console.log("Checking Info...");
    const info = await validateLinkrApiKey(API_KEY);
    console.log("Info result:", info);

    if (info.valid) {
        console.log("Submitting image test...");
        try {
            const url = await linkrWaitForResult("A cinematic highly detailed shot of a futuristic neon city --ar 16:9", API_KEY);
            console.log("SUCCESS, URL =>", url);
        } catch (e: any) {
            console.error("Test failed:", e.message);
        }
    }
}

run();
