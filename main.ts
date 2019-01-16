enum DriveMode {

    /**
     * controlled with programming, ignores controller axis input
     */
    //% block="Programmic"
    Programmic = 0,

    /**
     * left stick for driving, right stick for steering.
     */
    //% block="Natural"
    Natural = 1,

    /**
     * left stick for left wheel, right stick for right wheel.
     */
    //% block="PerWheel"
    PerWheel = 2,
}

enum DriveMotor {
    //% block="Motor M1"
    M1 = 0,
    //% block="Motor M2"
    M2 = 1,
    //% block="Motor M3"
    M3 = 2,
    //% block="Motor M4"
    M4 = 3
}

enum DriveDirection {
    //% block="Forward"
    Forward = 1,

    //% block="Backward"
    Backward = 0,

    //% block="Release"
    Release = 2
}

enum ControlAxis {
    //% block="Left Stick Left-Right Axis"
    LX = 3,
    //% block="Left Stick Up-Down Axis"
    LY = 4,
    //% block="Right Stick Left-Right Axis"
    RX = 1,
    //% block="Right Stick Up-Down Axis"
    RY = 2,
}

enum PS2Button {
    //% block="□"
    Square = 15,
    //% block="X"
    X = 14,
    //% block="○"
    O = 13,
    //% block="△"
    Triangle = 12,
    R1 = 11,
    L1 = 10,
    R2 = 9,
    L2 = 8,
    //% block="Left"
    Left = 7,
    //% block="Down"
    Down = 6,
    //% block="Right"
    Right = 5,
    //% block="Up"
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

    //% block="set drive mode to %mode"
    export function setDriveMode(mode: DriveMode) {
        driveModeBuf.setNumber(NumberFormat.UInt8LE, 3, mode);

        serial.writeBuffer(driveModeBuf);
    }

    const driveWeightBuf = createBuf(4, 1);

    //% block="set stick axis %axis weight on %motor to %weight"
    //% weight.min=-256 weight.max=256
    export function setDriveWeight(axis: ControlAxis, motor: DriveMotor, weight: number) {
        driveWeightBuf.setNumber(NumberFormat.UInt8LE, 3, axis);
        driveWeightBuf.setNumber(NumberFormat.UInt8LE, 4, motor);
        driveWeightBuf.setNumber(NumberFormat.UInt16LE, 5, weight);

        serial.writeBuffer(driveModeBuf);
    }

    const driveMotorBuf = createBuf(4, 2);

    //% block="drive motor %motor %direction with force %force"
    //% force.min=0 force.max=65535
    export function setMotorState(motor: DriveMotor, direction: DriveDirection, force: number = 0) {
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