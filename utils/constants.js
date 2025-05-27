export const DEFAULT_SHOP_HOURS = [
    {
        day: "monday",
        start: "9:00 AM",
        end: "5:00 PM",
        is_closed: false
    },
    {
        day: "tuesday",
        start: "9:00 AM",
        end: "5:00 PM",
        is_closed: false
    },
    {
        day: "wednesday",
        start: "9:00 AM",
        end: "5:00 PM",
        is_closed: false
    },
    {
        day: "thursday",
        start: "9:00 AM",
        end: "5:00 PM",
        is_closed: false
    },
    {
        day: "friday",
        start: "9:00 AM",
        end: "5:00 PM",
        is_closed: false
    },
    {
        day: "saturday",
        is_closed: true
    },
    {
        day: "sunday",
        is_closed: true
    }
]

export const DEFAULT_ISSUE_TREE = {
    "key": "default_issue_tree",
    "name": "Default Tree",
    "description": "General services issue tree",
    "default": true,
    "single_page_mode": false,
    "single_service_selection_only": false,
    "show_as_popular": true,
    "categories": [
        {
            "name": "Popular Services",
            "key": "svc_popular_services",
            "services": [
                {
                    "name": "Brakes",
                    "key": "brakes",
                    "description": "Complete brake diagnosis and repair service",
                    "icon": "brake-icon-url",
                    "destination_type": "question",
                    "popular_services": true,
                    "first_question": null
                }
            ]
        }
    ]
}
