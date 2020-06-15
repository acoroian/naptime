import { DateTime } from 'luxon';

export class NaptimeInput {
    usualWakeTime: DateTime
    usualBedTime: DateTime
    flightDayLatestWakeTime: DateTime
    preferredWakeTime: DateTime
    preferredBedTime: DateTime
    homeTimezone: string
    destinationTimezone: string
    arrivalDayEarliestBedTime: DateTime
    flightDepartureTime: DateTime
    flightArrivalTime: DateTime

    constructor(usualWakeTime: string,
        usualBedTime: string,
        flightDayLatestWakeTime: string,
        preferredWakeTime: string,
        preferredBedTime: string,
        arrivalDayEarliestBedTime: string,
        homeTimezone: string,
        destinationTimezone: string,
        flightDepartureTime: string,
        flightArrivalTime: string
    ) {


        this.homeTimezone = homeTimezone.replace('GMT', '')
        this.destinationTimezone = destinationTimezone.replace('GMT', '')

        let departureDate = DateTime.local().startOf('day').toFormat('LL/dd/yyyy')
        let arrivalDate = departureDate

        if (timeToNumber(flightDepartureTime) > timeToNumber(flightArrivalTime)) {
            arrivalDate = DateTime.local().startOf('day').plus({ days: 1 }).toFormat('LL/dd/yyyy')
        }

        let dateFormat = 'LL/dd/yyyy hh:mm Z'
        this.usualWakeTime = DateTime.fromFormat(departureDate + ' ' + usualWakeTime + ' ' + this.homeTimezone, dateFormat)
        this.usualBedTime = DateTime.fromFormat(departureDate + ' ' + usualBedTime + ' ' + this.homeTimezone, dateFormat)
        this.flightDayLatestWakeTime = DateTime.fromFormat(departureDate + ' ' + flightDayLatestWakeTime + ' ' + this.homeTimezone, dateFormat)
        this.preferredWakeTime = DateTime.fromFormat(arrivalDate + ' ' + preferredWakeTime + ' ' + this.destinationTimezone, dateFormat)
        this.preferredBedTime = DateTime.fromFormat(arrivalDate + ' ' + preferredBedTime + ' ' + this.destinationTimezone, dateFormat)
        this.arrivalDayEarliestBedTime = DateTime.fromFormat(arrivalDate + ' ' + arrivalDayEarliestBedTime + ' ' + this.destinationTimezone, dateFormat)
        this.flightDepartureTime = DateTime.fromFormat(departureDate + ' ' + flightDepartureTime + ' ' + this.homeTimezone, dateFormat)
        this.flightArrivalTime = DateTime.fromFormat(arrivalDate + ' ' + flightArrivalTime + ' ' + this.destinationTimezone, dateFormat)
    }
}

function timeToNumber(time: string): number {
    let timeComponents = time.split(':')
    let hour = parseInt(timeComponents[0])
    let minutes = parseInt(timeComponents[1]) / 60
    return hour + minutes
}