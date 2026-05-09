import { linkrImagine, linkrFetchTask } from './lib/linkrapi'

const API_KEY = 'lkr_4bf7e9097dfb4492b3553db349639c71'

async function run() {
    console.log("Submitting image test to imagine endpoint...");
    try {
        const taskId = await linkrImagine("A majestic white horse --ar 16:9", API_KEY);
        console.log("SUCCESS! Task ID:", taskId);

        console.log("Fetching status...");
        const result = await linkrFetchTask(taskId, API_KEY);
        console.log("Fetch result:", result);
    } catch (e: any) {
        console.error("Imagine Test failed:", e.message);
    }
}

run();
