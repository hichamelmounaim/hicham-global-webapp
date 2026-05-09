import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.spyKeyword.create({
            data: {
                keyword: "test_keyword_" + Date.now(),
                notes: "",
                source: "manual",
                rank: null,
                relatedTerms: null
            }
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
