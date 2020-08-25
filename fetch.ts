import got from 'got'
import * as fs from 'fs'
import * as path from 'path'
import * as AdmZip from "adm-zip";

const twitchBase = "https://addons-ecs.forgesvc.net/";

export async function fetch_new_project(from: number, version: string, modloader?: string, to = Date.now()) {
    let ret = [];
    for (let i = 0; i < 50; i++) {
        let num = 0;
        const g = await got.get(twitchBase + `api/v2/addon/search?gameId=432&index=${10 * i}&gameVersion=${version}&pageSize=10&sort=1&sectionId=6`)
        const json = JSON.parse(g.body);
        for (let i of json) {
            const files_req = await got.get(twitchBase + `api/v2/addon/${i.id}/files`);
            const files = JSON.parse(files_req.body);
            const sorted_file = files.sort((a, b) => {
                return new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime();
            })
            for (let file of sorted_file) {
                const versions = file.gameVersion as string[];
                if (versions.includes(version) && !modloader || versions.includes(modloader)) {
                    const dl = await got.get(file.downloadUrl);
                    const zip = new AdmZip(dl.rawBody);
                    const lang = zip.getEntries().map(i => {
                        if (/lang\/.+\.json/g.test(i.entryName)) {
                            fs.mkdirSync(path.dirname(path.join(__dirname,"maven", i.entryName)), {recursive: true});
                            if (i.entryName.endsWith("zh_cn.json") && fs.existsSync(path.join(__dirname, "maven", i.entryName)))
                                return;
                            fs.writeFileSync(path.join(__dirname, "maven", i.entryName), i.getData());
                        }
                    })
                    break;
                }

            }
            num++;
        }
        console.log(i)
    }
    fs.writeFileSync(path.join(__dirname, "maven/update_time.txt" ), Date.now().toString());
    return ret;
}



process.nextTick(async () => {
    console.log(await fetch_new_project(0, "1.16.1"))
})
