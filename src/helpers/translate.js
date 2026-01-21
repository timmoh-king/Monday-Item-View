import moment from "moment";

const replaceKeys = (originalObject, keyMappings) => {
    const replacedObject = {};

    for (const originalKey in originalObject) {
        const mappedKeyObject = keyMappings.find((item) => item.title === originalKey);
        const newKey = mappedKeyObject ? mappedKeyObject.id : originalKey;
        const type = mappedKeyObject ? mappedKeyObject.type : 'text';

        replacedObject[newKey] = {
            type: type,
            value: originalObject[originalKey]
        };
    }

    return replacedObject;
};

const checkMatches = (originalObject, keyMapper) => {
    const matches = {};

    for (const key in keyMapper) {
        const mapperKey = keyMapper[key];

        if (originalObject[key] !== undefined) {
            matches[mapperKey] = originalObject[key];
        }
    }

    return matches;
};

const itemsFormatted = (events) => {
    const formattedEvents = [];

    events.forEach((event) => {
        console.log("event", event);
        const person = event.column_values.find((col) => col.column.title === 'Person')?.
        persons_and_teams?.[0]?.id || null;;
        const firstname = person.value.find((val) => val.column.title === 'First Name').text;
        const lastname = person.value.find((val) => val.column.title === 'Last Name').text;
        const itemName = event.column_values.find((col) => col.column.title === 'Name').text;
        const status = event.column_values.find((col) => col.column.title === 'Status').text;

        formattedEvents.push({
            id: event.id,
            firstname: firstname.value,
            lastname: lastname.value,
            itemName: itemName.value,
            status: status.value,
        });
    });
    return formattedEvents;
}

const formatColumnValuesToQuery = (colValues) => {
    return Object.entries(colValues)
        .filter(([key, colVal]) => colVal !== null)
        .map(([key, colVal]) => {
            // Check for board relationship,hour && boolean types, format them accordingly
            if (colVal.type === 'board_relation') {
                return `\\\"${key}\\\":{\\\"linkedPulseIds\\\":[{\\\"linkedPulseId\\\":${colVal.value}}]}`;
            } else if (colVal.type === 'hour') {
                const [hours, minutes] = colVal.value.split(':');
                const formattedHours = parseInt(hours, 10);
                const formattedMinutes = parseInt(minutes, 10);

                if (!isNaN(formattedHours) && !isNaN(formattedMinutes)) {
                   return `\\\"${key}\\\":{\\\"hour\\\":${formattedHours},\\\"minute\\\":${formattedMinutes}}`;
                }

                return '';
            } else if (colVal.type === 'checkbox') {
                const booleanValue = colVal.value ? 'true' : 'false';
                return colVal.value ? `\\\"${key}\\\":{\\\"checked\\\":\\\"${booleanValue}\\\"}` : `\\\"${key}\\\" : null`;
            } else if (colVal.type === 'status') {
                return colVal.value ? `\\\"${key}\\\" : {\\\"label\\\" : \\\"${colVal.value}\\\"}` : '';
            } else if (colVal.type === 'people') {
                return colVal.value ? `\\\"${key}\\\" : {\\\"personsAndTeams\\\":[{\\\"id\\\":\\\"${colVal.value}\\\",\\\"kind\\\":\\\"person\\\"}]}` : ''
            } else if (colVal.type === 'email') {
                return `\\\"${key}\\\": {\\\"email\\\": \\\"${colVal.value}\\\", \\\"text\\\": \\\"${colVal.value}\\\"}`;
            } else if (colVal.type === 'timeline') {
                return `\\\"${key}\\\": {\\\"from\\\": \\\"${colVal.value.from}\\\", \\\"to\\\": \\\"${colVal.value.to}\\\"}`
            }
             else {
                return `\\\"${key}\\\": \\\"${colVal.value}\\\"`
            }
        })
        .filter(str => str !== '')  // Filter out empty strings
        .join(', ');
}

export { checkMatches, replaceKeys, itemsFormatted, formatColumnValuesToQuery };