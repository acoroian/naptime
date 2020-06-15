import { getNapLengthHours, runNaptime, naptime } from '../naptime';
import { NaptimeInput } from '../napTimeInput'

describe('Testing naptime', () => {
    test('Check the naptime function function', () => {
        // let naptimeInput = new NaptimeInput('07:00', '23:00', '07:30', '09:00', '01:00', '23:30', 'GMT-7', 'GMT+1', '16:45', '11:15')
        let naptimeInput = new NaptimeInput('07:30', '23:00', '05:00', '09:00', '23:00', '01:30', 'GMT-7', 'GMT+1', '21:30', '13:00')
        runNaptime(naptimeInput)
    });
});

describe('Testing nap length', () => {
    test('No naptime', () => {
        expect(getNapLengthHours(20)).toEqual(0);
    });
    test('1 hour', () => {
        expect(getNapLengthHours(21)).toEqual(1);
    });
    test('2 hour', () => {
        expect(getNapLengthHours(25)).toEqual(2);
    });
    test('4 hour', () => {
        expect(getNapLengthHours(29)).toEqual(4);
    });
    test('6 hour', () => {
        expect(getNapLengthHours(37)).toEqual(6);
    });
    test('8 hour', () => {
        expect(getNapLengthHours(43)).toEqual(8);
    });
})