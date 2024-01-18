import React, { useState } from 'react';
import { Widget, addResponseMessage, deleteMessages, toggleMsgLoader, toggleInputDisabled, setQuickButtons } from 'react-chat-widget';
import {scrollTo}
import { DashpoolEvent, TreeViewNode } from '../helper';
import { useDashpoolData } from './DashpoolProvider';
import '../chat.css';



type LoaderProps = {
    /**
     * Unique ID to identify this component in Dash callbacks.
     */
    id: string;

    /**
    * url to load the data
    */
    url: string;

    /**
    * default messages
    */
    messages: Array<any>;

    /**
    * title of the chat
    */
    title: any;

    /**
     * Event if a Tree Node changes
     */
    nodeChangeEvent?: TreeViewNode;

    /**
     * latest Dashpool Event
     */
    dashpoolEvent?: DashpoolEvent

    setProps: (props: Record<string, any>) => void;
}

async function fireEventsWithDelay(events, setPropsFunction) {
    for (const event of events) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setPropsFunction(event);
    }
    events.length = 0;
}



function handleStringResult(new_result, known_ids, events) {

    const jsonObjects = new_result.split('\n');

    if (jsonObjects) {

        // Process each complete JSON object
        for (let jsonObject of jsonObjects) {

            try {

                // Remove a trailing comma, if present
                jsonObject = jsonObject.replace(/,\s*$/, '');

                // Check if the string contains the word "assistant"
                if (jsonObject.includes("assistant")) {
                    // Check if the string already ends with "}
                    if (!jsonObject.endsWith('"}')) {
                        // Add "} to the end
                        jsonObject += '"}';
                    }
                }

                const message = JSON.parse(jsonObject);

                if (message.role === "assistant") {
                    if (known_ids.includes(message.id)) {
                        deleteMessages(1, message.id)
                    } else {
                        known_ids.push(message.id)
                    }
                    addResponseMessage(message.content, message.id)
                } else if (message.role === 'dashpoolEvent') {

                    if (!known_ids.includes(message.id)) {
                        known_ids.push(message.id)
                        events.push({ dashpoolEvent: message.content })
                    }
                } else if (message.role === 'nodeChangeEvent') {
                    if (!known_ids.includes(message.id)) {
                        known_ids.push(message.id)
                        events.push({ nodeChangeEvent: message.content })
                    }
                }

            } catch (error) { }
        }

    }

}

/**
 * Component to serve as Loader for Graphs
 */
const Chat = (props: LoaderProps) => {
    const { id, url, messages, title, setProps } = props;


    const { sharedData, updateSharedData } = useDashpoolData();

    const [currentMessages, setCurrentMessages] = useState(messages);
    const [inputDisabled, setInputDisabled] = useState(false);
    // State to manage user input
    const [userInput, setUserInput] = useState('');








    const handleNewUserMessage = async (newMessage) => {
        setCurrentMessages((prevMessages) => [
            ...prevMessages,
            { role: 'user', content: newMessage },
        ]);

        currentMessages.push({
            role: "user",
            content: newMessage
        });
        setCurrentMessages(currentMessages);


        setUserInput('');
        let result = '';
        let chunk;
        let known_ids = [];
        let events = [];        

        try {

            toggleInputDisabled();
            setInputDisabled(true);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify([
                    { role: 'sharedData', content: sharedData },
                    ...currentMessages,
                ]),
            });

            if (!response.ok) {
                let error_message = 'Network response was not ok';

                const err_result = await response.json();
                error_message = err_result['error'];

                throw new Error(error_message);
            }

            const reader = response.body.getReader();


            while (!(chunk = await reader.read()).done) {
                // Handle each chunk of the response
                const chunkText = new TextDecoder('utf-8').decode(chunk.value);
                result += chunkText;

                try {
                    // Attempt to find complete JSON objects in the result
                    handleStringResult(result, known_ids, events);

                    await fireEventsWithDelay(events, setProps);

                } catch (error) {
                    console.log(error);
                    // Handle JSON parsing errors if necessary
                }

                await fireEventsWithDelay(events, setProps);
            }
        } catch (error) {
            const errorMessage = `
            Sorry, an error occurred while processing your request.
          `;
            addResponseMessage(errorMessage);
            setCurrentMessages((prevMessages) => [
                ...prevMessages,
                { role: 'assistant', content: errorMessage },
            ]);

            toggleInputDisabled();
            setInputDisabled(false);
            return;
        }

        
        const j_result = JSON.parse(result);
        j_result.forEach((message: any) => {
            if (message.role === 'assistant') {

                currentMessages.push({
                    role: 'assistant',
                    content: message.content
                })

                if (!known_ids.includes(message.id)) {
                    addResponseMessage(message.content, message.id)
                }

            } else if (message.role === 'dashpoolEvent') {

                if (!known_ids.includes(message.id)) {
                    events.push({ dashpoolEvent: message.content })
                }
            } else if (message.role === 'nodeChangeEvent') {
                if (!known_ids.includes(message.id)) {
                    events.push({ nodeChangeEvent: message.content })
                }
            }
        })

        setCurrentMessages(currentMessages);
        await fireEventsWithDelay(events, setProps);

        toggleInputDisabled();
        setInputDisabled(false);
    };




    const handleQuickButton = (value: any) => {
        if (!inputDisabled) {
            if (value == "clearall") {
                deleteMessages(currentMessages.length);
                setCurrentMessages([])
            }

            if (value == "removelast") {
                deleteMessages(1);
                currentMessages.pop()
                setCurrentMessages(currentMessages)
            }
        }
    };

    setQuickButtons([{ label: 'Clear last', value: 'removelast' }, { label: 'Clear all', value: 'clearall' }])


    const vis = (url === "") ? "hidden" : "visible";

    return (


        <div style={{ visibility: vis }}>
            <Widget
                id={id}
                title={title}
                handleNewUserMessage={handleNewUserMessage}
                handleQuickButtonClicked={handleQuickButton}
                emojis={false}
                resizable={false}
                showTimeStamp={false}
                showCloseButton={true}
                profileAvatar="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2aWV3Qm94PSIwIDAgMjcwIDI3MCIgd2lkdGg9IjI3MCIgaGVpZ2h0PSIyNzAiPgogICAgPHN0eWxlPgogICAgICAgIEBrZXlmcmFtZXMgZGFzaFBvb2xMb2dvX2JveE1vdmUgewogICAgICAgICAgICAwJSB7CiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwKTsKICAgICAgICAgICAgfQoKICAgICAgICAgICAgNTAlIHsKICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIC01JSk7CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIDEwMCUgewogICAgICAgICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMCk7CiAgICAgICAgICAgIH0KICAgICAgICB9CgogICAgICAgIEBrZXlmcmFtZXMgZGFzaFBvb2xMb2dvX2RvdE1vdmUgewogICAgICAgICAgICAwJSB7CiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDAuMSkgdHJhbnNsYXRlKDEwJSwgMTAlICkgOwogICAgICAgICAgICAgICAgb3BhY2l0eTogMS4wOwogICAgICAgICAgICB9CgogICAgICAgICAgICAyMCUgewogICAgICAgICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgxLjEpICB0cmFuc2xhdGUoLTElLCAtMSUgKSA7CiAgICAgICAgICAgIH0KCiAgICAgICAgICAgIDUwJSB7CiAgICAgICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEpIHRyYW5zbGF0ZSgwLCAwICk7CiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxOwogICAgICAgICAgICB9CgogICAgICAgICAgICA5MCUgewogICAgICAgICAgICAgICAgc2NhbGUoMS4wMSk6CiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxOwogICAgICAgICAgICB9CgogICAgICAgICAgICAxMDAlIHsKICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMS41KSB0cmFuc2xhdGUoLTIlLCAtMiUgKTsKICAgICAgICAgICAgICAgIG9wYWNpdHk6IDA7CiAgICAgICAgICAgIH0KICAgICAgICB9CiAgICA8L3N0eWxlPgogICAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgcng9IjEyJSIgZmlsbD0icmdiKDI1NSwxMDIsMCkiIC8+CiAgICA8cmVjdCB4PSI2JSIgeT0iOCUiIHJ4PSI3LjI5IiByeT0iNy4yOSIgaGVpZ2h0PSI4NSUiIHdpZHRoPSI2LjMlIiBzdHlsZT0iZmlsbDpyZ2IoMjA0LDIwNCwyMDQpO3Bvc2l0aW9uOmFic29sdXRlOyIvPgogICAgPHJlY3QgeD0iNiUiIHk9Ijg4JSIgcng9IjcuMjkiIHJ5PSI3LjI5IiBoZWlnaHQ9IjYuMyUiIHdpZHRoPSI4NyUiIHN0eWxlPSJmaWxsOnJnYigyMDQsMjA0LDIwNCk7cG9zaXRpb246YWJzb2x1dGU7Ii8+CiAgICA8cmVjdCB4PSIxOC42JSIgeT0iNDAlIiByeD0iMTQuODUiIHJ5PSIxNC44NSIgaGVpZ2h0PSIyOCUiIHdpZHRoPSIxMiUiIHN0eWxlPSJmaWxsOnJnYigyMDQsMjA0LDIwNCk7cG9zaXRpb246YWJzb2x1dGU7YW5pbWF0aW9uLW5hbWU6ZGFzaFBvb2xMb2dvX2JveE1vdmU7YW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudDppbmZpbml0ZTthbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOmVhc2U7YW5pbWF0aW9uLWZpbGwtbW9kZTpib3RoO2FuaW1hdGlvbi1kdXJhdGlvbjoxczthbmltYXRpb24tZGVsYXk6MHM7Ii8+CiAgICA8cmVjdCB4PSIzNi42JSIgeT0iNDUlIiByeD0iMTQuODUiIHJ5PSIxNC44NSIgaGVpZ2h0PSIyOCUiIHdpZHRoPSIxMiUiIHN0eWxlPSJmaWxsOnJnYigyMDQsMjA0LDIwNCk7cG9zaXRpb246YWJzb2x1dGU7YW5pbWF0aW9uLW5hbWU6ZGFzaFBvb2xMb2dvX2JveE1vdmU7YW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudDppbmZpbml0ZTthbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOmVhc2U7YW5pbWF0aW9uLWZpbGwtbW9kZTpib3RoO2FuaW1hdGlvbi1kdXJhdGlvbjoxczthbmltYXRpb24tZGVsYXk6MC4xczsiLz4KICAgIDxyZWN0IHg9IjU1LjMlIiB5PSIyNSUiIHJ4PSIxNC44NSIgcnk9IjE0Ljg1IiBoZWlnaHQ9IjI4JSIgd2lkdGg9IjEyJSIgc3R5bGU9ImZpbGw6cmdiKDIwNCwyMDQsMjA0KTtwb3NpdGlvbjphYnNvbHV0ZTthbmltYXRpb24tbmFtZTpkYXNoUG9vbExvZ29fYm94TW92ZTthbmltYXRpb24taXRlcmF0aW9uLWNvdW50OmluZmluaXRlO2FuaW1hdGlvbi10aW1pbmctZnVuY3Rpb246ZWFzZTthbmltYXRpb24tZmlsbC1tb2RlOmJvdGg7YW5pbWF0aW9uLWR1cmF0aW9uOjFzO2FuaW1hdGlvbi1kZWxheTowLjJzOyIvPgogICAgPHJlY3QgeD0iNzMuNiUiIHk9IjI3JSIgcng9IjE0Ljg1IiByeT0iMTQuODUiIGhlaWdodD0iMjglIiB3aWR0aD0iMTIlIiBzdHlsZT0iZmlsbDpyZ2IoMjA0LDIwNCwyMDQpO3Bvc2l0aW9uOmFic29sdXRlO2FuaW1hdGlvbi1uYW1lOmRhc2hQb29sTG9nb19ib3hNb3ZlO2FuaW1hdGlvbi1pdGVyYXRpb24tY291bnQ6aW5maW5pdGU7YW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvbjplYXNlO2FuaW1hdGlvbi1maWxsLW1vZGU6Ym90aDthbmltYXRpb24tZHVyYXRpb246MXM7YW5pbWF0aW9uLWRlbGF5OjAuM3M7Ii8+CgogICAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNTIuOTIgMTk0LjQpIj4KICAgICAgICA8cmVjdCByeD0iOS45OSIgcnk9IjkuOTkiIGhlaWdodD0iMTAlIiB3aWR0aD0iOS44JSIgc3R5bGU9ImZpbGw6cmdiKDI1NSwyNTUsMjU1KTtwb3NpdGlvbjphYnNvbHV0ZTthbmltYXRpb24tbmFtZTpkYXNoUG9vbExvZ29fZG90TW92ZTthbmltYXRpb24taXRlcmF0aW9uLWNvdW50OmluZmluaXRlO2FuaW1hdGlvbi10aW1pbmctZnVuY3Rpb246ZWFzZTthbmltYXRpb24tZmlsbC1tb2RlOmJvdGg7YW5pbWF0aW9uLWR1cmF0aW9uOjFzO2FuaW1hdGlvbi1kZWxheTotMC40czsiLz4KICAgIDwvZz4KICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEwMS41MiA1NS45KSI+CiAgICAgICAgPHJlY3Qgcng9IjkuOTkiIHJ5PSI5Ljk5IiBoZWlnaHQ9IjEwJSIgd2lkdGg9IjkuOCUiIHN0eWxlPSJmaWxsOnJnYigyNTUsMjU1LDI1NSk7cG9zaXRpb246YWJzb2x1dGU7YW5pbWF0aW9uLW5hbWU6ZGFzaFBvb2xMb2dvX2RvdE1vdmU7YW5pbWF0aW9uLWl0ZXJhdGlvbi1jb3VudDppbmZpbml0ZTthbmltYXRpb24tdGltaW5nLWZ1bmN0aW9uOmVhc2U7YW5pbWF0aW9uLWZpbGwtbW9kZTpib3RoO2FuaW1hdGlvbi1kdXJhdGlvbjoxczthbmltYXRpb24tZGVsYXk6LTAuMnM7Ii8+CiAgICA8L2c+CiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDEuNjkgMjEuNikiPgogICAgICAgIDxyZWN0IHJ4PSI5Ljk5IiByeT0iOS45OSIgaGVpZ2h0PSIxMCUiIHdpZHRoPSI5LjglIiBzdHlsZT0iZmlsbDpyZ2IoMjU1LDI1NSwyNTUpO3Bvc2l0aW9uOmFic29sdXRlO2FuaW1hdGlvbi1uYW1lOmRhc2hQb29sTG9nb19kb3RNb3ZlO2FuaW1hdGlvbi1pdGVyYXRpb24tY291bnQ6aW5maW5pdGU7YW5pbWF0aW9uLXRpbWluZy1mdW5jdGlvbjplYXNlO2FuaW1hdGlvbi1maWxsLW1vZGU6Ym90aDthbmltYXRpb24tZHVyYXRpb246MXM7YW5pbWF0aW9uLWRlbGF5OjAuMHM7Ii8+CiAgICA8L2c+CiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyMDEuNjkgMTUzLjkpIj4KICAgICAgICA8cmVjdCByeD0iOS45OSIgcnk9IjkuOTkiIGhlaWdodD0iMTAlIiB3aWR0aD0iOS44JSIgc3R5bGU9ImZpbGw6cmdiKDI1NSwyNTUsMjU1KTtwb3NpdGlvbjphYnNvbHV0ZTthbmltYXRpb24tbmFtZTpkYXNoUG9vbExvZ29fZG90TW92ZTthbmltYXRpb24taXRlcmF0aW9uLWNvdW50OmluZmluaXRlO2FuaW1hdGlvbi10aW1pbmctZnVuY3Rpb246ZWFzZTthbmltYXRpb24tZmlsbC1tb2RlOmJvdGg7YW5pbWF0aW9uLWR1cmF0aW9uOjFzO2FuaW1hdGlvbi1kZWxheTowLjJzOyIvPgogICAgPC9nPgo8L3N2Zz4="
            />
        </div>
    );
};

Chat.defaultProps = {
    title: "Dashpool Chat AI",
    messages: [],
    url: ""
};

export default Chat;
