// A check exports run(input, ctx) and returns { status: 'ok'|'warn'|'fail', findings: [...] }.
export async function run(file, ctx) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const hasExif = buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 &&
    String.fromCharCode(...buf.slice(0, 4096)).includes('Exif');
  return { status: hasExif ? 'warn' : 'ok', findings: [hasExif ? 'EXIF block present' : 'No EXIF block found'] };
}
