import { DateTime, Interval } from 'luxon';

export class NapTimeResult {
    nap?: Interval
    destinationTimezone: string
    napFound: boolean
    napLength: number

    constructor(napFound: boolean, destinationTimezone: string, napLength: number, nap?: Interval) {
        this.nap = nap
        this.destinationTimezone = destinationTimezone
        this.napFound = napFound
        this.napLength = napLength
    }
}
