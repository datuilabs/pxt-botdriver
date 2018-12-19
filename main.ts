enum DriveMode {
    Programmic = 0,
    Natural = 1,
    PerWheel = 2,
}

//% color="#ff9800"
namespace dtbd {

    function createBuf(len: number, type: number) {
        const buf = pins.createBuffer(len + 3);
        buf.setNumber(NumberFormat.UInt8LE, 0, 42);
        buf.setNumber(NumberFormat.UInt8LE, 1, len);
        buf.setNumber(NumberFormat.UInt8LE, 2, type);
        return buf;
    }

    const driveModeBuf = createBuf(1, 0);

    //% block
    export function setDriveMode(mode: DriveMode) {
        driveModeBuf.setNumber(NumberFormat.UInt8LE, 3, mode);
        serial.writeBuffer(driveModeBuf);

        const resp = serial.readUntil("\r");
        return resp == "ok";
    }
}