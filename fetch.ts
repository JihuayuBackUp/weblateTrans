import got from 'got'
import * as fs from 'fs'
import * as path from 'path'
import * as AdmZip from "adm-zip";

const twitchBase = "https://addons-ecs.forgesvc.net/";

export async function fetch_new_project(from: number, version: string, modloader?: string, to = Date.now()) {
    let ret = [];
    for (let i = 0; i < 1; i++) {
        let num = 0;
        const g = await got.get(twitchBase + `api/v2/addon/search?gameId=432&index=${10 * i}&gameVersion=${version}&pageSize=10&sort=1&sectionId=6`)
        const json = JSON.parse(g.body);
        for (let project of json) {
            const files_req = await got.get(twitchBase + `api/v2/addon/${project.id}/files`);
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
                            const modid = i.entryName.replace(/assets\/(.+)\/lang\/.+/, "$1")
                            const lang_name = i.entryName.replace(/assets\/.+\/lang\/(.+)/, "$1")
                            const file_path = path.join(__dirname, "maven","minecraft_1-16_modtranslationresourcepack", modid, project.slug, lang_name)
                            fs.mkdirSync(path.dirname(file_path), {recursive: true});
                            if (i.entryName.endsWith("zh_cn.json") && fs.existsSync(file_path))
                                return;
                            fs.writeFileSync(file_path, i.getData());
                        }
                    })
                    break;
                }

            }
            num++;
        }
        console.log(i)
    }
    fs.writeFileSync(path.join(__dirname, "maven/update_time.txt"), Date.now().toString());
    return ret;
}


process.nextTick(async () => {
    console.log(await fetch_new_project(0, "1.16.1"))
})
