import { supabase } from '../supabaseClient'; // Ensure you import your Supabase client

export const updateTargetLanguage = async (userId: string, targetLanguage: string) => {
    try {
        // Fetch current target_languages for the user
        const { data: currentData, error: fetchError } = await supabase
            .from('users')
            .select('target_languages')
            .eq('id', userId)
            .single(); // Fetch the current value

        if (fetchError) {
            console.error('Error fetching current target_languages:', fetchError);
            throw fetchError;
        }

        // Get current languages or initialize as empty array if null
        const currentLanguages = currentData.target_languages || [];

        // Only add the language if it doesn't already exist in the array
        let updatedLanguages = currentLanguages;
        if (!currentLanguages.includes(targetLanguage)) {
            updatedLanguages = [...currentLanguages, targetLanguage];
        } else {
            console.log(`Language "${targetLanguage}" already exists in user's target languages.`);
            // If nothing to update, you could return early here
            return currentData; // Return existing data since nothing changed
        }

        // Then update with the full array
        const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({ target_languages: updatedLanguages })
        .eq('id', userId)
        .select();

        if (updateError) {
            console.error('Error updating target_languages:', updateError);
            throw updateError;
        }

        return updateData; // Return the updated data
    } catch (error) {
        console.error('Error in updateTargetLanguage:', error);
        throw error; // Rethrow the error for handling in the calling function
    }
}; 