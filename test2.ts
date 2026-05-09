const API_KEY = 'lkr_4bf7e9097dfb4492b3553db349639c71'

async function checkUrl(url: string) {
    try {
        console.log("Checking", url)
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${API_KEY}` }
        })
        console.log(`[${res.status}] ${url}`)
        const text = await res.text()
        console.log("Response:", text.slice(0, 200))
    } catch(e: any) {
        console.log(`Failed ${url}:`, e.message)
    }
}

async function run() {
    await checkUrl("https://linkrapi.com/api/v1/info")
    await checkUrl("https://api.linkrapi.com/v1/info")
    await checkUrl("https://api.linkrapi.com/v1/account")
}
run();
