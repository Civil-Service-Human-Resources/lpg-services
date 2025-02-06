import {
	registerDecorator,
	ValidationArguments,
	ValidationOptions,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from 'class-validator'

export function Match(property: string, validationOptions?: ValidationOptions) {
	return (object: any, propertyName: string) => {
		registerDecorator({
			constraints: [property],
			options: validationOptions,
			propertyName,
			target: object.constructor,
			validator: MatchConstraint,
		})
	}
}

@ValidatorConstraint({name: 'Match'})
export class MatchConstraint implements ValidatorConstraintInterface {
	validate(value: any, args: ValidationArguments) {
		const [relatedPropertyName] = args.constraints
		const relatedValue = (args.object as any)[relatedPropertyName]
		return value === relatedValue
	}

	defaultMessage(args: ValidationArguments) {
		const [relatedPropertyName] = args.constraints
		return `${relatedPropertyName} and ${args.property} don't match`
	}
}
