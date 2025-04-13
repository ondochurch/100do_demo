import re, json, os

txt_files = os.listdir('outputs')

def find_txt_file(s):
    for fn in txt_files:
        print(fn, s)
        if fn.startswith(s):
            return fn
    return ""

outputs = []

vline = 0
for s in open('outputs/100-q-all.txt'):
    if s[0] == '#':
        vline = s
    if re.match(r'^[123]\..*', s):
        q = re.search(r"\*\*(.*)\*\*", s).groups()[0]
        a = re.search(r".*\*\* : (.*)", s).groups()[0]
        fn = find_txt_file(vline[4:].strip())
        title = ','.join(fn.split(',')[:2])
        video_id = re.search(r"\[(.+)\]", fn).groups()[0]
        qa = {"question": q, "answer": a, "title":title, "videoId": video_id}
        outputs.append(qa)

with open('_output.json', 'w') as f:
    f.write(json.dumps(outputs, indent=4))