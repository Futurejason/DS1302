/**
* makecode DS1302CLOCK RTC Package.
* From microbit/micropython Chinese community.
* http://www.micropython.org.cn
*/

enum times{
    //% block=year
    time1 = 0,
    //% block=month
    time2 = 1,
    //% block=day
    time3 = 2,
    //% block=hour
    time4 = 3,
    //% block=minute
    time5 = 4,
    //% block=second
    time6 = 5,
}



/**
 * DS1302CLOCK block
 */
//% weight=100 color=#A050E0 icon="\uf017" block="RTC DS1302CLOCK"
namespace DS1302CLOCK {
    let DS1302_REG_SECOND = 0x80
    let DS1302_REG_MINUTE = 0x82
    let DS1302_REG_HOUR = 0x84
    let DS1302_REG_DAY = 0x86
    let DS1302_REG_MONTH = 0x88
    let DS1302_REG_WEEKDAY = 0x8A
    let DS1302_REG_YEAR = 0x8C
    let DS1302_REG_WP = 0x8E
    let DS1302_REG_CTRL = 0x90
    let DS1302_REG_RAM = 0xC0

    /**
     * convert a Hex data to Dec
     */
    function HexToDec(dat: number): number {
        return (dat >> 4) * 10 + (dat % 16);
    }

    /**
     * convert a Dec data to Hex
     */
    function DecToHex(dat: number): number {
        return Math.idiv(dat, 10) * 16 + (dat % 10)
    }

    /**
     * DS1302CLOCK RTC class
     */
    export class DS1302RTC {
        clk: DigitalPin;
        dio: DigitalPin;
        cs: DigitalPin;

        /**
         * write a byte to DS1302CLOCK
         */
        write_byte(dat: number) {
            for (let i = 0; i < 8; i++) {
                pins.digitalWritePin(this.dio, (dat >> i) & 1);
                pins.digitalWritePin(this.clk, 1);
                pins.digitalWritePin(this.clk, 0);
            }
        }

        /**
         * read a byte from DS1302CLOCK
         */
        read_byte(): number {
            let d = 0;
            for (let i = 0; i < 8; i++) {
                d = d | (pins.digitalReadPin(this.dio) << i);
                pins.digitalWritePin(this.clk, 1);
                pins.digitalWritePin(this.clk, 0);
            }
            return d;
        }

        /**
         * read reg
         */
        getReg(reg: number): number {
            let t = 0;
            pins.digitalWritePin(this.cs, 1);
            this.write_byte(reg);
            t = this.read_byte();
            pins.digitalWritePin(this.cs, 0);
            return t;
        }

        /**
         * write reg
         */
        setReg(reg: number, dat: number) {
            pins.digitalWritePin(this.cs, 1);
            this.write_byte(reg);
            this.write_byte(dat);
            pins.digitalWritePin(this.cs, 0);
        }

        /**
         * write reg with WP protect
         */
        wr(reg: number, dat: number) {
            this.setReg(DS1302_REG_WP, 0)
            this.setReg(reg, dat)
            this.setReg(DS1302_REG_WP, 0)
        }

        /**
         * get Year
         */
        //% blockId="DS1302_get_year" block="%ds|get time %TIME"
        //% weight=80 blockGap=8
        //% parts="DS1302CLOCK"
        getYear(TIME: times): number {
            switch(TIME){
                case 0:
                    return Math.min(HexToDec(this.getReg(DS1302_REG_YEAR + 1)), 99) + 2000;
                case 1:
                    return Math.max(Math.min(HexToDec(this.getReg(DS1302_REG_MONTH + 1)), 12), 1);
                case 2:
                    return Math.max(Math.min(HexToDec(this.getReg(DS1302_REG_DAY + 1)), 31), 1);
                case 3:
                    return Math.min(HexToDec(this.getReg(DS1302_REG_HOUR + 1)), 23);
                case 4:
                    return Math.min(HexToDec(this.getReg(DS1302_REG_MINUTE + 1)), 59);
                default:
                    return Math.min(HexToDec(this.getReg(DS1302_REG_SECOND + 1)), 59);
            }
            
        }

        /**
         * set year
         * @param dat is the Year will be set, eg: 2018
         */
        //% blockId="DS1302_set_year" block="%ds|set year %dat set month %mon set day %days"
        //% weight=81 blockGap=8
        //% parts="DS1302CLOCK"
        //% mon.min=1 mon.max=12
        //% days.min=1 days.max=31
        setYear(dat: number, mon: number, days: number): void {
            this.wr(DS1302_REG_YEAR, DecToHex(dat % 100));
            this.wr(DS1302_REG_MONTH, DecToHex(mon % 13));
            this.wr(DS1302_REG_DAY, DecToHex(days % 32))
        }

        /**
         * set hour
         * @param dat is the Hour will be set, eg: 0
         */
        //% blockId="DS1302_set_hour" block="%ds|set hour %dat set minute %minu set second %sec"
        //% weight=73 blockGap=8
        //% parts="DS1302CLOCK"
        //% dat.min=0 dat.max=23
        //% minu.min=0 minu.max=59
        //% sec.min=0 sec.max=59
        setHour(dat: number, minu: number, sec: number): void {
            this.wr(DS1302_REG_HOUR, DecToHex(dat % 24));
            this.wr(DS1302_REG_MINUTE, DecToHex(minu % 60));
            this.wr(DS1302_REG_SECOND, DecToHex(sec % 60));
        }

        
        
        /**
         * start DS1302CLOCK RTC (go on)
         */
        //% blockId="DS1302_start" block="%ds|start RTC"
        //% weight=41 blockGap=8
        //% parts="DS1302CLOCK"
        start() {
            let t = Math.min(HexToDec(this.getReg(DS1302_REG_SECOND + 1)), 59)
            this.wr(DS1302_REG_SECOND, DecToHex(t & 0x7f % 60))
        }

        /**
         * pause DS1302CLOCK RTC
         */
        //% blockId="DS1302_pause" block="%ds|pause RTC"
        //% weight=40 blockGap=8
        //% parts="DS1302CLOCK"
        pause() {
            let t = Math.min(HexToDec(this.getReg(DS1302_REG_SECOND + 1)), 59)
            this.wr(DS1302_REG_SECOND, DecToHex(t | 0x80 % 60))
        }

    }

    /**
     * create a DS1302CLOCK object.
     * @param clk the CLK pin for DS1302CLOCK, eg: DigitalPin.P13
     * @param dio the DIO pin for DS1302CLOCK, eg: DigitalPin.P14
     * @param cs the CS pin for DS1302CLOCK, eg: DigitalPin.P15
     */
    //% weight=200 blockGap=8
    //% blockId="DS1302_create" block="CLK %clk|DIO %dio|CS %cs"
    export function create(clk: DigitalPin, dio: DigitalPin, cs: DigitalPin): DS1302RTC {
        let ds = new DS1302RTC();
        ds.clk = clk;
        ds.dio = dio;
        ds.cs = cs;
        pins.digitalWritePin(ds.clk, 0);
        pins.digitalWritePin(ds.cs, 0);
        return ds;
    }
}
