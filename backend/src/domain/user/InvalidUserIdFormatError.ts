import { DomainError } from "../../lib/error";

export class InvalidUserIdFormatError extends DomainError{
    public code: string = 'INVALID_USER_ID_FORMAT';

    constructor(){
        super(`The User Id format is invalid. It must be a valid UUID v7.`)
    }
}