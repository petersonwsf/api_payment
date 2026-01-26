export function isNumber( value : any ) {
    const coercedValue = +value
    const isNumber = !isNaN(coercedValue) && isFinite(coercedValue)
    return isNumber
}