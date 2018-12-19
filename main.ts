enum DriveMode {
    Programmic = 0,
    Natural = 1,
    PerWheel = 2,
}

//% color="#ff9800"
namespace dtbd {

    function createBuf(len: number, type: number) {
        const buf = pins.createBuffer(len + 3);
        buf.setNumber(NumberFormat.UInt8LE, 0, 0x42);
        buf.setNumber(NumberFormat.UInt8LE, 1, len+1);
        buf.setNumber(NumberFormat.UInt8LE, 2, type);
        return buf;
    }

    const driveModeBuf = createBuf(1, 0);

    //% block
    export function setDriveMode(mode: DriveMode) {
        driveModeBuf.setNumber(NumberFormat.UInt8LE, 3, mode);
        serial.redirect(
            SerialPin.P13,
            SerialPin.P16,
            BaudRate.BaudRate9600
        );
        serial.writeBuffer(driveModeBuf);
    }

    //% block
    export function isCommandSuccessful() {
        const resp = serial.readUntil("\r");
        return resp == "ok";
    }
}