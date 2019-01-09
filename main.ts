enum DriveMode {
    Programmic = 0,
    Natural = 1,
    PerWheel = 2,
}

enum DriveMotor {
    M1 = 0,
    M2 = 1,
    M3 = 2,
    M4 = 3
}

enum DriveDirection {
    Forward = 1,
    Backward = 0,
    Release = 2
}

enum ControlAxis {
    RX = 1,
    RY = 2,
    LX = 3,
    LY = 4,
}

enum PS2Button {
    Square = 15,
    X = 14,
    O = 13,
    Triangle = 12,
    R1 = 11,
    L1 = 10,
    R2 = 9,
    L2 = 8,
    Left = 7,
    Down = 6,
    Right = 5,
    Up = 4,
    Start = 3,
    R3 = 2,
    L3 = 1,
    Select = 0,
}

//% color="#ff9800"
namespace dtbd {

    function createBuf(len: number, type: number) {
        const buf = pins.createBuffer(len + 3);
        buf.setNumber(NumberFormat.UInt8LE, 0, 0x42);
        buf.setNumber(NumberFormat.UInt8LE, 1, len + 1);
        buf.setNumber(NumberFormat.UInt8LE, 2, type);
        return buf;
    }

    const driveModeBuf = createBuf(1, 0);

    //% block
    export function setDriveMode(mode: DriveMode) {
        driveModeBuf.setNumber(NumberFormat.UInt8LE, 3, mode);

        serial.writeBuffer(driveModeBuf);
    }

    const driveWeightBuf = createBuf(4, 1);

    //% block
    export function setDriveWeight(axis: ControlAxis, motor: DriveMotor, weight: number) {
        driveWeightBuf.setNumber(NumberFormat.UInt8LE, 3, axis);
        driveWeightBuf.setNumber(NumberFormat.UInt8LE, 4, motor);
        driveWeightBuf.setNumber(NumberFormat.UInt16LE, 5, weight);

        serial.writeBuffer(driveModeBuf);
    }

    const driveMotorBuf = createBuf(4, 2);

    //% block
    export function setMotorState(motor: DriveMotor, direction: DriveDirection, force: number) {
        driveMotorBuf.setNumber(NumberFormat.Int8LE, 3, motor);
        driveMotorBuf.setNumber(NumberFormat.Int8LE, 4, direction);
        driveMotorBuf.setNumber(NumberFormat.UInt16LE, 5, force);

        serial.writeBuffer(driveMotorBuf);
    }

    serial.redirect(
        SerialPin.P13,
        SerialPin.P16,
        BaudRate.BaudRate9600
    );

    const btnOnListeners: (() => void)[][] = [];
    const btnOffListeners: (() => void)[][] = [];
    let prevBtnState = 0;

    basic.forever(function () {
        while (true) {
            const buf = serial.readUntil("\n");
            if (buf == "ps2") {
                const ps2 = serial.readBuffer(2);
                const btnState = ps2.getNumber(NumberFormat.Int16LE, 0);
                const diff = btnState ^ prevBtnState;
                // serial.writeLine("btn state: " + btnState + " diff " + diff + " prev " + prevBtnState);

                for (let i = 0, s = 1; i < 16; i += 1, s = s << 1) {
                    if ((diff & s) == 0) continue;

                    const cbs = (btnState & s) > 0 ? btnOnListeners[i] : btnOffListeners[i];
                    if (cbs) {
                        //serial.writeLine("cbs len " + cbs.length);
                        for (let j = 0; j < cbs.length; j++) {
                            cbs[j]();
                        }
                    }
                }

                prevBtnState = btnState;
            }
        }
    });

    //% block="when button %btn is pressed"
    export function onButtonPressed(btn: PS2Button, callback: () => void) {
        if (!btnOnListeners[btn]) btnOnListeners[btn] = [];
        btnOnListeners[btn].push(callback);
        //serial.writeLine("btn on reg " + btn);
    }

    //% block="when button %btn is released"
    export function onButtonReleased(btn: PS2Button, callback: () => void) {
        if (!btnOffListeners[btn]) btnOffListeners[btn] = [];
        btnOffListeners[btn].push(callback);
        //serial.writeLine("btn off reg " + btn);
    }
}