import React, { useState } from 'react';
import { Widget, addResponseMessage, deleteMessages } from 'react-chat-widget';
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

    setProps: (props: Record<string, any>) => void;
}


/**
 * Component to serve as Loader for Graphs
 */
const Chat = (props: LoaderProps) => {
    const { id, url, messages, title, setProps } = props;

    // State to manage user input
    const [userInput, setUserInput] = useState('');

    // Function to handle user input
    const handleNewUserMessage = async (newMessage: string) => {
        // Add the user's message to the messages array
        messages.push({
            role: "user",
            content: newMessage
        });

        // Clear the user input
        setUserInput('');

        try {
            // Make a POST request to the specified URL with the user's message
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messages),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            // Parse the response as JSON
            const result = await response.json();

            // Process the messages in the result
            result.forEach((message: any) => {
                if (message.role === 'function') {
                    // If the role is function, make a function call
                    // Implement your function call logic here
                } else if (message.role === 'assistant') {
                    // If the role is assistant, add the message to the chat
                    addResponseMessage(message.content);
                    messages.push({
                        role: 'assistant', 
                        content: message.content
                    })
                }
            });

        } catch (error) {
            console.error('Error:', error);
            // Handle errors, display an error message in the chat, etc.
            addResponseMessage('Sorry, an error occurred while processing your request.');
        }
    };

    const handleToggle = () => {
        deleteMessages(messages.length);
    };

    return (
        <div>
            <Widget
                title={title}
                handleNewUserMessage={handleNewUserMessage}
                handleToggle={handleToggle}
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
    messages: []
};

export default Chat;
